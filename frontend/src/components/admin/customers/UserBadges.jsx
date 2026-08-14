import { Shield, User } from 'lucide-react'

export function UserRoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm ${
        isAdmin
          ? 'bg-neutral-950 text-white shadow-xs'
          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
      }`}
    >
      {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
    </span>
  )
}

export function UserStatusBadge({ isActive = true }) {
  const active = isActive !== false
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm border ${
        active
          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
          : 'border-rose-200 bg-rose-50/80 text-rose-800'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
      {active ? 'Hoạt động' : 'Đã vô hiệu hóa'}
    </span>
  )
}
