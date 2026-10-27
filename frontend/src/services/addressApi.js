import axiosClient from './axiosClient.js'
import { CanceledError } from 'axios'

export const ADDRESS_REQUEST_TIMEOUT_MS = 15000

// Deadline bao trùm cả Promise Axios/interceptor, kể cả thời gian chờ refresh.
// Abort chỉ dừng phía client, không hoàn tác thao tác ghi ở backend.
function requestAddress(operation, { signal, timeout = ADDRESS_REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const duration = Number.isFinite(timeout) && timeout > 0 ? timeout : ADDRESS_REQUEST_TIMEOUT_MS
  return new Promise((resolve, reject) => {
    let timer
    let settled = false
    let started = false
    const finish = (complete, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      complete(value)
    }
    const cancel = () => {
      const error = new CanceledError('Address request canceled')
      error.addressRequestStarted = started
      finish(reject, error)
      controller.abort()
    }
    if (signal?.aborted) { cancel(); return }
    signal?.addEventListener('abort', cancel, { once: true })
    timer = setTimeout(() => {
      const error = Object.assign(new Error('Address request timed out'), { code: 'ECONNABORTED', addressRequestStarted: started })
      finish(reject, error)
      controller.abort()
    }, duration)
    try {
      started = true
      Promise.resolve(operation({ signal: controller.signal, timeout: duration }))
        .then((response) => finish(resolve, response), (error) => finish(reject, error))
    } catch (error) {
      finish(reject, error)
    }
  })
}

export const getAddresses = (options) => requestAddress((config) => axiosClient.get('/addresses', config), options)
export const createAddress = (data, options) => requestAddress((config) => axiosClient.post('/addresses', data, config), options)
export const updateAddress = (addressId, data, options) => requestAddress((config) => axiosClient.patch(`/addresses/${encodeURIComponent(addressId)}`, data, config), options)
export const deleteAddress = (addressId, options) => requestAddress((config) => axiosClient.delete(`/addresses/${encodeURIComponent(addressId)}`, config), options)
export const setDefaultAddress = (addressId, options) => requestAddress((config) => axiosClient.patch(`/addresses/${encodeURIComponent(addressId)}/default`, {}, config), options)
