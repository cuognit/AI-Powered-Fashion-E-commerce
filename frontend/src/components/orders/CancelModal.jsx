import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'
import { cancelReasonLabels } from '../../utils/orderStatus.js'

export default function CancelModal({ order, busy, onClose, onConfirm }) {
  const [reasonCode, setReasonCode] = useState('changed_mind')
  const [note, setNote] = useState('')
  if (!order) return null
  return <div className='fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4' role='dialog' aria-modal='true'>
    <form onSubmit={(event) => { event.preventDefault(); onConfirm({ reasonCode, note }) }} className='w-full max-w-lg rounded-none bg-white p-6 shadow-2xl'>
      <div className='flex items-start justify-between'><div><p className='text-xs font-bold uppercase tracking-widest text-neutral-500'>Đơn {order.orderCode}</p><h2 className='mt-1 text-2xl font-black uppercase'>Hủy đơn hàng</h2></div><button type='button' onClick={onClose} className='rounded-full p-2 hover:bg-neutral-100'><X /></button></div>
      {order.paymentMethod === 'VNPAY' && order.paymentStatus === 'paid' && <div className='mt-5 flex gap-3 rounded-none bg-amber-50 p-4 text-sm text-amber-800'><AlertCircle className='shrink-0' /><p>Đơn sẽ dừng xử lý và chuyển sang chờ hoàn tiền thủ công.</p></div>}
      <label className='mt-5 block text-xs font-black uppercase tracking-wider'>Lý do hủy</label>
      <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className='mt-2 w-full rounded-none border border-neutral-300 bg-white p-3 text-sm'>{Object.entries(cancelReasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <label className='mt-4 block text-xs font-black uppercase tracking-wider'>Ghi chú (tùy chọn)</label>
      <textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} rows={3} className='mt-2 w-full rounded-none border border-neutral-300 p-3 text-sm' />
      <div className='mt-6 flex gap-3'><button type='button' onClick={onClose} className='flex-1 rounded-none border px-4 py-3 text-xs font-black uppercase'>Giữ đơn</button><button disabled={busy} className='flex-1 rounded-none bg-red-600 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50'>{busy ? 'Đang hủy...' : 'Xác nhận hủy'}</button></div>
    </form>
  </div>
}
