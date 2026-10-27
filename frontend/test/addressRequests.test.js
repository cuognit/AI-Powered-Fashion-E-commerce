import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { addressErrorMessage } from '../src/utils/addressErrors.js'

const source = readFileSync(new URL('../src/hooks/useAddressBook.js', import.meta.url), 'utf8')
  .replace(/^import .*$/gm, '')
  .replace('export default function useAddressBook', 'function useAddressBook')
const buildHook = new Function('useCallback', 'useEffect', 'useRef', 'useState', 'createAddress', 'getAddresses', 'updateAddress', 'deleteAddress', 'setDefaultAddress', 'addressErrorMessage', `${source}; return useAddressBook`)
const tick = () => new Promise((resolve) => setImmediate(resolve))
const deferred = () => { let resolve; let reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail }); return { promise, resolve, reject } }
const empty = () => ({ items: [], defaultAddressId: null, count: 0 })
const book = (id) => ({ items: [{ id, fullName: 'Sample', isDefault: true }], defaultAddressId: id, count: 1 })
const apiError = (status) => Object.assign(new Error('Request failed'), { response: { status, data: { message: 'Sample error' } } })

function mount(ownerId, api) {
  const slots = []
  let cursor = 0
  let mounted = true
  let lateWrites = 0
  let effects = []
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const useState = (initial) => {
    const index = cursor++
    slots[index] ||= { value: initial }
    return [slots[index].value, (value) => {
      if (!mounted) lateWrites += 1
      slots[index].value = typeof value === 'function' ? value(slots[index].value) : value
    }]
  }
  const useRef = (initial) => { const index = cursor++; slots[index] ||= { current: initial }; return slots[index] }
  const useCallback = (callback, deps) => {
    const index = cursor++
    if (!same(slots[index]?.deps, deps)) slots[index] = { value: callback, deps }
    return slots[index].value
  }
  const useEffect = (callback, deps) => {
    const index = cursor++
    if (!same(slots[index]?.deps, deps)) {
      const previous = slots[index]
      slots[index] = { deps, cleanup: null }
      effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = callback() })
    }
  }
  const hook = buildHook(useCallback, useEffect, useRef, useState, api.createAddress, api.getAddresses, api.updateAddress, api.deleteAddress, api.setDefaultAddress, addressErrorMessage)
  const read = () => { cursor = 0; const value = hook(ownerId); const pending = effects; effects = []; pending.forEach((effect) => effect()); return value }
  read()
  return { read, unmount: () => { mounted = false; slots.forEach((slot) => slot.cleanup?.()) }, lateWrites: () => lateWrites }
}

test('GET thành công, lỗi/thử lại và danh sách rỗng đều lấy dữ liệu API', async () => {
  let failure = true
  const run = mount('A', { getAddresses: async () => { if (failure) throw apiError(500); return { data: empty() } }, createAddress: async () => { } })
  await tick()
  assert.equal(run.read().loading, false)
  assert.ok(run.read().loadError.includes('Máy chủ'))
  assert.ok(!run.read().loadError.includes('Sample error'))
  failure = false
  await run.read().reload()
  assert.deepEqual(run.read().book, empty())
  assert.equal(run.read().loadError, '')
  run.unmount()
})

test('POST thành công dùng nguyên danh sách server trả về', async () => {
  let calls = 0
  const run = mount('A', { getAddresses: async () => ({ data: empty() }), createAddress: async () => { calls += 1; return { data: book('server-id') } } })
  await tick()
  assert.equal(await run.read().addAddress({ fullName: 'Sample' }), true)
  assert.deepEqual(run.read().book, book('server-id'))
  assert.equal(run.read().saving, false)
  assert.equal(calls, 1)
  run.unmount()
})

for (const failure of [apiError(409), apiError(500), new Error('Network timeout')]) {
  test(`POST ${failure.response?.status || 'network'} không retry; cần GET trước lần gửi tiếp`, async () => {
    let posts = 0
    const run = mount('A', { getAddresses: async () => ({ data: book('existing') }), createAddress: async () => { posts += 1; throw failure } })
    await tick()
    await assert.rejects(() => run.read().addAddress({}), (error) => error === failure)
    assert.equal(run.read().needsReload, true)
    assert.equal(posts, 1)
    await assert.rejects(() => run.read().addAddress({}))
    assert.equal(posts, 1)
    assert.deepEqual(run.read().book, book('existing'))
    await run.read().reload()
    assert.equal(run.read().needsReload, false)
    assert.equal(posts, 1)
    run.unmount()
  })
}

test('POST 400 không thay danh sách và không tự thử lại', async () => {
  let posts = 0
  const run = mount('A', { getAddresses: async () => ({ data: empty() }), createAddress: async () => { posts += 1; throw apiError(400) } })
  await tick()
  await assert.rejects(() => run.read().addAddress({}))
  assert.deepEqual(run.read().book, empty())
  assert.equal(run.read().needsReload, false)
  assert.equal(posts, 1)
  run.unmount()
})

test('GET cũ trả sau GET mới không được ghi đè', async () => {
  const old = deferred()
  let calls = 0
  let oldSignal
  const run = mount('A', { getAddresses: ({ signal }) => { if (++calls === 1) { oldSignal = signal; return old.promise } return Promise.resolve({ data: book('new') }) }, createAddress: async () => { } })
  await run.read().reload()
  old.resolve({ data: book('old') })
  await tick()
  assert.equal(oldSignal.aborted, true)
  assert.deepEqual(run.read().book, book('new'))
  run.unmount()
})

test('unmount/đổi tài khoản abort GET cũ, không đưa dữ liệu A vào phiên B', async () => {
  const old = deferred()
  let signalA
  const a = mount('A', { getAddresses: ({ signal }) => { signalA = signal; return old.promise }, createAddress: async () => { } })
  a.unmount()
  const b = mount('B', { getAddresses: async () => ({ data: book('B') }), createAddress: async () => { } })
  old.resolve({ data: book('A') })
  await tick()
  assert.equal(signalA.aborted, true)
  assert.equal(a.lateWrites(), 0)
  assert.deepEqual(b.read().book, book('B'))
  b.unmount()
})

test('POST đang chạy chặn lần bấm gửi thứ hai; unmount bỏ qua response', async () => {
  const pending = deferred()
  let posts = 0
  let signal
  const run = mount('A', { getAddresses: async () => ({ data: empty() }), createAddress: (_data, options) => { posts += 1; signal = options.signal; return pending.promise } })
  await tick()
  const save = run.read().addAddress({})
  await assert.rejects(() => run.read().addAddress({}))
  assert.equal(posts, 1)
  run.unmount()
  pending.resolve({ data: book('saved') })
  assert.equal(await save, false)
  assert.equal(signal.aborted, true)
  assert.equal(run.lateWrites(), 0)
})

test('không có tài khoản thì không gọi API', async () => {
  let calls = 0
  const run = mount(null, { getAddresses: async () => { calls += 1 }, createAddress: async () => { calls += 1 } })
  await tick()
  await assert.rejects(() => run.read().addAddress({}))
  assert.equal(calls, 0)
  run.unmount()
})

const operations = [
  { kind: 'update', apiName: 'updateAddress', call: (hook) => hook.editAddress('target', { city: 'Thành phố Mẫu' }) },
  { kind: 'delete', apiName: 'deleteAddress', call: (hook) => hook.removeAddress('target') },
  { kind: 'default', apiName: 'setDefaultAddress', call: (hook) => hook.makeDefault('target') },
]

for (const operation of operations) {
  test(`${operation.kind}: chỉ cập nhật danh sách sau response và hiển thị pending đúng địa chỉ`, async () => {
    const pending = deferred()
    const before = book('before')
    const after = operation.kind === 'delete' ? empty() : book('target')
    let calls = 0
    let args
    const run = mount('A', {
      getAddresses: async () => ({ data: before }),
      [operation.apiName]: (...values) => { calls += 1; args = values; return pending.promise },
    })
    await tick()
    const result = operation.call(run.read())
    assert.equal(run.read().saving, true)
    assert.deepEqual(run.read().pending, { kind: operation.kind, addressId: 'target' })
    assert.deepEqual(run.read().book, before)
    assert.equal(args[0], 'target')
    if (operation.kind === 'update') assert.deepEqual(args[1], { city: 'Thành phố Mẫu' })
    await assert.rejects(() => operation.call(run.read()))
    assert.equal(calls, 1)
    pending.resolve({ data: after })
    assert.equal(await result, true)
    assert.deepEqual(run.read().book, after)
    assert.equal(run.read().saving, false)
    assert.equal(run.read().pending, null)
    run.unmount()
  })

  test(`${operation.kind}: lỗi 404/409/mất mạng giữ UI cũ, không retry và yêu cầu GET lại`, async () => {
    for (const failure of [apiError(404), apiError(409), new Error('Lost response')]) {
      let calls = 0
      const before = book('before')
      const run = mount('A', { getAddresses: async () => ({ data: before }), [operation.apiName]: async () => { calls += 1; throw failure } })
      await tick()
      await assert.rejects(() => operation.call(run.read()), (error) => error === failure)
      assert.deepEqual(run.read().book, before)
      assert.equal(run.read().needsReload, true)
      await assert.rejects(() => operation.call(run.read()))
      assert.equal(calls, 1)
      await run.read().reload()
      assert.equal(run.read().needsReload, false)
      assert.equal(calls, 1)
      run.unmount()
    }
  })

  test(`${operation.kind}: unmount abort request và không cập nhật phiên cũ`, async () => {
    const pending = deferred()
    let signal
    const run = mount('A', { getAddresses: async () => ({ data: book('before') }), [operation.apiName]: (...args) => { signal = args.at(-1).signal; return pending.promise } })
    await tick()
    const result = operation.call(run.read())
    run.unmount()
    pending.resolve({ data: book('after') })
    assert.equal(await result, false)
    assert.equal(signal.aborted, true)
    assert.equal(run.lateWrites(), 0)
  })
}

test('mutation đang chạy chặn thao tác khác và không GET chen vào', async () => {
  const pending = deferred()
  let reads = 0
  let deletes = 0
  const run = mount('A', {
    getAddresses: async () => { reads += 1; return { data: book('target') } },
    updateAddress: () => pending.promise,
    deleteAddress: async () => { deletes += 1; return { data: empty() } },
  })
  await tick()
  const update = run.read().editAddress('target', { label: 'Mẫu' })
  await assert.rejects(() => run.read().removeAddress('target'))
  await run.read().reload()
  assert.equal(reads, 1)
  assert.equal(deletes, 0)
  pending.resolve({ data: book('target') })
  await update
  run.unmount()
})

test('GET timeout kết thúc loading và retry có thể phục hồi', async () => {
  let timedOut = true
  const run = mount('A', {
    getAddresses: async () => {
      if (timedOut) throw Object.assign(new Error('Timeout'), { code: 'ECONNABORTED' })
      return { data: book('fresh') }
    }
  })
  await tick()
  assert.equal(run.read().loading, false)
  assert.ok(run.read().loadError.includes('chờ quá lâu'))
  timedOut = false
  await run.read().reload()
  assert.equal(run.read().loadError, '')
  assert.deepEqual(run.read().book, book('fresh'))
  run.unmount()
})

test('cleanup của GET cũ không tắt loading của GET mới đang chờ', async () => {
  const first = deferred()
  const second = deferred()
  let calls = 0
  const run = mount('A', { getAddresses: () => ++calls === 1 ? first.promise : second.promise })
  const retry = run.read().reload()
  first.reject(Object.assign(new Error('Canceled'), { code: 'ERR_CANCELED' }))
  await tick()
  assert.equal(run.read().loading, true)
  assert.equal(run.read().loadError, '')
  second.resolve({ data: book('new') })
  await retry
  assert.equal(run.read().loading, false)
  run.unmount()
})

for (const operation of operations) {
  test(`${operation.kind}: cancellation sau khi gửi vẫn là kết quả chưa chắc chắn`, async () => {
    const error = Object.assign(new Error('Canceled'), { code: 'ERR_CANCELED', addressRequestStarted: true })
    const run = mount('A', { getAddresses: async () => ({ data: book('before') }), [operation.apiName]: async () => { throw error } })
    await tick()
    await assert.rejects(() => operation.call(run.read()), (value) => value === error)
    assert.equal(run.read().saving, false)
    assert.equal(run.read().pending, null)
    assert.equal(run.read().needsReload, true)
    assert.deepEqual(run.read().book, book('before'))
    run.unmount()
  })
}

test('hủy trước khi gửi khác với kết quả ghi chưa xác định', async () => {
  const error = Object.assign(new Error('Canceled before send'), { code: 'ERR_CANCELED', addressRequestStarted: false })
  const run = mount('A', { getAddresses: async () => ({ data: empty() }), createAddress: async () => { throw error } })
  await tick()
  await assert.rejects(() => run.read().addAddress({}))
  assert.equal(run.read().saving, false)
  assert.equal(run.read().needsReload, false)
  run.unmount()
})
