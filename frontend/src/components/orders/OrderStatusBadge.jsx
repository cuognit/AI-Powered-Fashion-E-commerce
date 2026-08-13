import { orderStatusMeta, statusToneClasses } from '../../utils/orderStatus.js'

export default function OrderStatusBadge({ status }) {
  const meta = orderStatusMeta[status] || { label: status, tone: 'amber' }
  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${statusToneClasses[meta.tone]}`}>
    {meta.label}
  </span>
}
