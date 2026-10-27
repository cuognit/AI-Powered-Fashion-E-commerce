import { CanceledError } from 'axios'

export const COMPARISON_TIMEOUT_MS = 12_000

function timeoutError(timeout) {
  return Object.assign(new Error(`Product API phản hồi quá chậm (quá ${timeout / 1000} giây). Vui lòng thử tải lại.`), { code: 'COMPARISON_TIMEOUT' })
}

export function requestComparisonProduct(client, id, { signal, timeout = COMPARISON_TIMEOUT_MS } = {}) {
  const controller = new AbortController()

  return new Promise((resolve, reject) => {
    let settled = false
    let timer
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      callback(value)
    }
    const cancel = () => {
      finish(reject, new CanceledError('Lựa chọn đã thay đổi hoặc trang đã đóng.'))
      controller.abort()
    }

    if (signal?.aborted) {
      cancel()
      return
    }
    signal?.addEventListener('abort', cancel, { once: true })

    timer = setTimeout(() => {
      finish(reject, timeoutError(timeout))
      controller.abort()
    }, timeout)

    Promise.resolve().then(() => client.get(`/products/${id}`, {
      timeout,
      signal: controller.signal,
    })).then(
      (response) => finish(resolve, response),
      (error) => finish(reject, ['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code) ? timeoutError(timeout) : error),
    )
  })
}
