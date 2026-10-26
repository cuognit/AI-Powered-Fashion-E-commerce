import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { hasAddressChanged } from '../src/components/address-book/addressSchema.js'

const page = readFileSync(new URL('../src/pages/shop/AddressBookPage.jsx', import.meta.url), 'utf8')
const expression = page.match(/const submitBlocked = ([^\r\n]+)/)[1]
const blocked = new Function('listBlocked', 'editingMissing', 'editingChanged', 'editingAddress', 'atLimit', `return ${expression}`)

test('sau refresh, cùng ID nhưng nội dung đổi phải chặn submit bản nháp cũ', () => {
  assert.equal(blocked(false, false, true, { id: 'same-id' }, false), true)
})

test('đủ 20 địa chỉ vẫn sửa được nếu không có xung đột nội dung', () => {
  assert.equal(blocked(false, false, false, { id: 'same-id' }, true), false)
  assert.equal(blocked(false, false, false, null, true), true)
})

test('phát hiện đổi nội dung theo cùng ID, bỏ qua metadata không thuộc bản nháp', () => {
  const before = { id: 'same-id', fullName: 'Người nhận Mẫu', phone: '000 000 0001', address: 'Địa chỉ Mẫu', city: 'Thành phố Mẫu', label: '', isDefault: false }
  assert.equal(hasAddressChanged(before, { ...before, city: 'Thành phố mới' }), true)
  assert.equal(hasAddressChanged(before, { ...before, isDefault: true }), false)
  assert.equal(hasAddressChanged(before, { ...before, isDefault: true }, { includeDefault: true }), true)
  assert.equal(hasAddressChanged(before, { ...before, label: '  ' }), true)
  assert.equal(hasAddressChanged(before, null), false)
})

test('chỉ thay bản nháp bằng dữ liệu mới khi người dùng chủ động chọn', () => {
  const start = page.indexOf('  const replaceDraftWithLatest = () => {')
  const code = page.slice(start, page.indexOf('\n\n  const saveAddress', start))
  const build = new Function('currentEditing', 'listBlocked', 'saving', 'setEditingAddress', 'setActionError', 'setNotice', `${code}; return replaceDraftWithLatest`)
  let draft = { id: 'same-id', city: 'Bản nháp' }
  const latest = { id: 'same-id', city: 'Dữ liệu mới từ server' }
  const choose = build(latest, false, false, (value) => { draft = value }, () => { }, () => { })
  assert.equal(draft.city, 'Bản nháp')
  choose()
  assert.equal(draft, latest)
  const blockedChoice = build({ ...latest, city: 'Không được nạp' }, true, false, (value) => { draft = value }, () => { }, () => { })
  blockedChoice()
  assert.equal(draft, latest)
})

test('cleanup hủy animation frame, không trả focus khi trang đã unmount', () => {
  const setupCode = page.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[\]\)/)[1]
  const active = { current: false }
  const focusFrameRef = { current: 7 }
  const canceled = []
  const cleanup = new Function('active', 'focusFrameRef', 'cancelAnimationFrame', setupCode)(active, focusFrameRef, (id) => canceled.push(id))
  assert.equal(active.current, true)
  cleanup()
  assert.equal(active.current, false)
  assert.deepEqual(canceled, [7])
})

test('Escape dialog chỉ đóng khi chưa có request ghi, không gọi xác nhận xóa', () => {
  const dialog = readFileSync(new URL('../src/components/address-book/DeleteAddressConfirm.jsx', import.meta.url), 'utf8')
  const body = dialog.match(/onCancel=\{\(event\) => \{([^}]+)\}\}/)[1]
  const escape = new Function('event', 'busy', 'onCancel', body)
  let prevented = 0
  let closed = 0
  const event = { preventDefault() { prevented += 1 } }
  escape(event, true, () => { closed += 1 })
  assert.equal(closed, 0)
  escape(event, false, () => { closed += 1 })
  assert.equal(closed, 1)
  assert.equal(prevented, 2)
})
