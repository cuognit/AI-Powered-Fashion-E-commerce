import { Badge, Boxes, ChevronRight, LayoutDashboard, PackageSearch, Settings, SlidersHorizontal, Tags, Users } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const groups = [
  { label: 'Tổng quan', items: [{ label: 'Bảng điều khiển', path: '/admin', icon: LayoutDashboard, end: true }] },
  {
    label: 'Quản lý cửa hàng',
    items: [
      { label: 'Sản phẩm', path: '/admin/products', icon: Boxes },
      { label: 'Danh mục', path: '/admin/categories', icon: Tags },
      { label: 'Thương hiệu', path: '/admin/brands', icon: Badge },
      { label: 'Thuộc tính', path: '/admin/attributes', icon: SlidersHorizontal },
      { label: 'Đơn hàng', path: '/admin/orders', icon: PackageSearch },
      { label: 'Khách hàng', path: '/admin/customers', icon: Users },
    ],
  },
  { label: 'Hệ thống', items: [{ label: 'Cài đặt', path: '/admin/settings', icon: Settings }] },
]

export default function AdminSidebar({ onNavigate }) {
  return (
    <aside className='flex h-full w-72 shrink-0 flex-col border-r border-neutral-800 bg-black text-white' aria-label='Điều hướng quản trị'>
      <div className='flex h-[73px] items-center border-b border-neutral-800 px-6'>
        <Link to='/admin' onClick={onNavigate} className='flex min-w-0 items-center gap-3'>
          <span className='grid h-9 w-9 shrink-0 place-items-center bg-white text-sm font-black text-black'>A</span>
          <span className='min-w-0'>
            <span className='block truncate text-base font-black uppercase tracking-[0.16em]'>AESTHETIX</span>
            <span className='block text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-500'>Administration</span>
          </span>
        </Link>
      </div>
      <nav className='custom-scrollbar flex-1 space-y-7 overflow-y-auto px-4 py-6'>
        {groups.map((group) => (
          <div key={group.label}>
            <p className='mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-600'>{group.label}</p>
            <div className='space-y-1'>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink key={item.path} to={item.path} end={item.end} onClick={onNavigate}
                    className={({ isActive }) => `group flex items-center justify-between px-3 py-3 text-xs font-bold uppercase tracking-[0.08em] transition ${isActive ? 'bg-white text-black' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
                    {({ isActive }) => <>
                      <span className='flex items-center gap-3'><Icon className='h-[18px] w-[18px] stroke-[1.8]' />{item.label}</span>
                      <ChevronRight className={`h-4 w-4 transition ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                    </>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className='border-t border-neutral-800 px-7 py-5'>
        <p className='text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-600'>Khu vực quản trị</p>
        <p className='mt-1 text-[10px] font-semibold text-neutral-400'>AESTHETIX Commerce · v1.0</p>
      </div>
    </aside>
  )
}
