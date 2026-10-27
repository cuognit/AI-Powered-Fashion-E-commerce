import { useEffect, useId, useRef } from 'react'
import Button from '../Button.jsx'

export default function DeleteAddressConfirm({ address, busy, blocked, error, needsReload, loading, onCancel, onConfirm, onReload, blockedMessage = 'Chưa thể xóa: danh sách chưa tải xong hoặc địa chỉ không còn trong danh sách. Bạn có thể hủy để kiểm tra lại.' }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const dialogId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog.showModal()
    cancelRef.current?.focus()
    return () => {
      dialog.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.disabled) previousFocus.focus()
    }
  }, [])

  return (
    <dialog ref={dialogRef} aria-labelledby={`${dialogId}-title`} aria-describedby={`${dialogId}-description`} aria-busy={busy} onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto border border-neutral-300 bg-white p-5 text-neutral-950 shadow-xl backdrop:bg-black/40 sm:p-6">
      <h2 id={`${dialogId}-title`} className="text-xl font-bold">Xóa địa chỉ này?</h2>
      <p id={`${dialogId}-description`} className="mt-3 text-sm leading-6 text-neutral-600">Địa chỉ sẽ bị xóa khỏi sổ địa chỉ của bạn sau khi máy chủ xác nhận. Thao tác này không thay đổi địa chỉ Checkout hoặc đơn hàng.</p>
      <div className="mt-4 min-w-0 border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 [overflow-wrap:anywhere]">
        <p className="font-bold">{address.fullName}</p>
        <p>{address.phone}</p>
        <p>{address.address}</p>
        <p>{[address.ward, address.district, address.city].filter(Boolean).join(', ')}</p>
        {address.isDefault && <p className="mt-2 font-semibold">Địa chỉ mặc định. Nếu còn địa chỉ khác, hệ thống sẽ chọn địa chỉ được tạo sớm nhất làm mặc định.</p>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {needsReload && (
        <div className="mt-4 text-sm leading-6 text-amber-900">
          <p>Tải lại và kiểm tra danh sách trước khi thực hiện tiếp. Nếu địa chỉ không còn, hãy đóng xác nhận.</p>
          <Button onClick={onReload} disabled={loading || busy} className="mt-2 min-h-11 border border-amber-800 px-4 py-2 font-bold disabled:opacity-50">{loading ? 'Đang tải…' : 'Tải lại danh sách'}</Button>
        </div>
      )}
      {blocked && !needsReload && <p role="status" className="mt-4 text-sm text-amber-900">{blockedMessage}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button ref={cancelRef} onClick={onCancel} disabled={busy} className="min-h-11 border border-neutral-300 px-5 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50">Hủy</Button>
        <Button onClick={onConfirm} disabled={busy || blocked} className="min-h-11 bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xác nhận xóa'}</Button>
      </div>
    </dialog>
  )
}
