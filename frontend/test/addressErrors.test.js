import assert from 'node:assert/strict'
import test from 'node:test'
import { addressErrorMessage } from '../src/utils/addressErrors.js'

const httpError = (status, details) => ({ response: { status, data: { message: 'MongoServerError private stack', stack: 'private', details } } })

test('400 validation khác 400 request chung', () => {
  assert.ok(addressErrorMessage(httpError(400, { fieldErrors: { phone: ['Sai định dạng'] } })).includes('trường được đánh dấu'))
  assert.ok(addressErrorMessage(httpError(400)).includes('Yêu cầu địa chỉ không hợp lệ'))
})

test('401/403/404/409 có hướng dẫn theo status, không dùng message nội bộ', () => {
  for (const [status, text] of [[401, 'đăng nhập lại'], [403, 'không có quyền'], [404, 'không thuộc tài khoản'], [409, 'đối chiếu']]) {
    const message = addressErrorMessage(httpError(status), { mutation: true })
    assert.ok(message.includes(text))
    assert.ok(!message.includes('MongoServerError'))
    assert.ok(!message.includes('private'))
  }
})

test('500 luôn che nội bộ; lỗi ghi nói rõ máy chủ có thể đã ghi', () => {
  const message = addressErrorMessage(httpError(500), { mutation: true })
  assert.ok(message.includes('có thể đã ghi'))
  assert.ok(!message.includes('private'))
  assert.ok(!message.includes('MongoServerError'))
})

test('timeout khác lỗi mạng và đọc khác ghi', () => {
  assert.ok(addressErrorMessage({ code: 'ECONNABORTED' }).includes('chờ quá lâu'))
  assert.ok(addressErrorMessage(new Error('Network Error')).includes('Không nhận được phản hồi'))
  assert.ok(!addressErrorMessage({ code: 'ECONNABORTED' }).includes('có thể đã ghi'))
  assert.ok(addressErrorMessage({ code: 'ECONNABORTED' }, { mutation: true }).includes('có thể đã ghi'))
})

test('cancellation sau khi gửi hoặc không biết thời điểm không được coi là chưa ghi', () => {
  for (const started of [true, undefined]) {
    const message = addressErrorMessage({ code: 'ERR_CANCELED', addressRequestStarted: started }, { mutation: true })
    assert.ok(message.includes('dừng chờ'))
    assert.ok(message.includes('có thể đã ghi'))
  }
  const before = addressErrorMessage({ code: 'ERR_CANCELED', addressRequestStarted: false }, { mutation: true })
  assert.equal(before, 'Đã hủy yêu cầu trước khi gửi dữ liệu.')
})

test('khóa cục bộ trước gửi không được mô tả như mất phản hồi của thao tác đã gửi', () => {
  assert.equal(addressErrorMessage({ code: 'ADDRESS_RELOAD_REQUIRED' }, { mutation: true }), 'Vui lòng tải lại danh sách trước khi thực hiện tiếp.')
})
