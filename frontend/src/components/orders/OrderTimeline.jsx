import { Check, ClipboardCheck, PackageCheck, RotateCcw, ShoppingBag, Truck, X } from 'lucide-react'
import { formatOrderDate } from '../../utils/orderStatus.js'

const steps = [
  ['order_created', 'Đã đặt hàng', ShoppingBag],
  ['processing', 'Đang xử lý', ClipboardCheck],
  ['shipped', 'Đang giao', Truck],
  ['completed', 'Đã giao', PackageCheck],
]
const statusIndex = { pending_payment: 0, pending: 0, processing: 1, shipped: 2, completed: 3 }

function CanceledTimeline({ order, history }) {
  const canceledAt = [...history].reverse().find((entry) => entry.event === 'canceled')?.occurredAt || order.updatedAt
  return <div className='grid gap-4 sm:grid-cols-2'>
    <div className='flex gap-3 rounded-none border p-4'><Check /><div><b>Đã đặt hàng</b><p>{formatOrderDate(order.createdAt, true)}</p></div></div>
    <div className='flex gap-3 rounded-none border border-red-200 bg-red-50 p-4'><X /><div><b>Đơn hàng đã hủy</b><p>{formatOrderDate(canceledAt, true)}</p></div></div>
    {order.refund?.status !== 'none' && <div className='flex gap-3 rounded-none border border-amber-200 bg-amber-50 p-4 sm:col-span-2'>
      <RotateCcw className='text-amber-700' />
      <div><b>{order.refund.status === 'completed' ? 'Đã hoàn tiền' : 'Đang chờ hoàn tiền'}</b><p>{order.refund.status === 'completed' ? formatOrderDate(order.refund.completedAt, true) : 'Cửa hàng sẽ xử lý hoàn tiền thủ công.'}</p></div>
    </div>}
  </div>
}

export default function OrderTimeline({ order }) {
  const history = order.statusHistory || []
  if (order.status === 'canceled') return <CanceledTimeline order={order} history={history} />
  const activeIndex = statusIndex[order.status] ?? 0
  const eventTime = (key) => [...history].reverse().find((entry) => entry.event === key)?.occurredAt
  return <div className='relative grid gap-3 md:grid-cols-4'>
    <div className='absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-neutral-200 md:block' />
    {steps.map(([key, label, Icon], index) => {
      const reached = index <= activeIndex
      const current = index === activeIndex && order.status !== 'completed'
      return <div key={key} className={`relative flex gap-4 rounded-none border p-4 md:flex-col md:items-center md:border-0 md:bg-transparent md:p-0 md:text-center ${reached ? 'border-black bg-white' : 'border-neutral-200 bg-neutral-50 text-neutral-400'}`}>
        <span className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ${reached ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white'} ${current ? 'ring-4 ring-neutral-200' : ''}`}>{index < activeIndex || order.status === 'completed' ? <Check /> : <Icon />}</span>
        <div><p className='text-xs font-black uppercase tracking-wider'>{label}</p><p className='mt-1 text-[11px] text-neutral-500'>{reached ? formatOrderDate(eventTime(key) || (index === 0 ? order.createdAt : null), true) : 'Chưa cập nhật'}</p></div>
      </div>
    })}
  </div>
}
