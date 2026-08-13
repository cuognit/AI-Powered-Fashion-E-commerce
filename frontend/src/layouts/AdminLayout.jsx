import { useEffect, useState } from 'react'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar.jsx'
import useAuth from '../hooks/useAuth.js'

const pageTitles = {
  '/admin': 'Bảng điều khiển',
  '/admin/products': 'Quản lý sản phẩm',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/brands': 'Quản lý thương hiệu',
  '/admin/attributes': 'Quản lý thuộc tính',
  '/admin/orders': 'Quản lý đơn hàng',
  '/admin/customers': 'Quản lý khách hàng',
  '/admin/settings': 'Cài đặt hệ thống',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => setSidebarOpen(false), [pathname])

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Đăng xuất thành công')
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className='admin-shell min-h-screen bg-[#ece9e2] text-neutral-950'>
      <div className='fixed inset-y-0 left-0 z-40 hidden lg:block'><AdminSidebar /></div>

      <div className={`fixed inset-0 z-[80] lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!sidebarOpen}>
        <button type='button' aria-label='Đóng menu quản trị' onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-y-0 left-0 w-72 max-w-[86vw] transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          <button type='button' onClick={() => setSidebarOpen(false)} aria-label='Đóng menu'
            className='absolute right-0 top-4 grid h-10 w-10 translate-x-full place-items-center bg-white text-black shadow-lg'>
            <X className='h-5 w-5' />
          </button>
        </div>
      </div>

      <div className='min-h-screen lg:pl-72'>
        <header className='sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-neutral-200 bg-[#f8f8f8]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8'>
          <div className='flex min-w-0 items-center gap-3'>
            <button type='button' onClick={() => setSidebarOpen(true)}
              className='grid h-10 w-10 shrink-0 place-items-center border border-neutral-300 bg-white transition hover:border-black lg:hidden'
              aria-label='Mở menu quản trị' aria-expanded={sidebarOpen}>
              <Menu className='h-5 w-5' />
            </button>
            <div className='min-w-0'>
              <p className='hidden text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 sm:block'>Không gian quản trị</p>
              <p className='truncate text-sm font-black uppercase tracking-[0.05em] sm:mt-0.5 sm:text-base'>{pageTitles[pathname] || 'Trang quản trị'}</p>
            </div>
          </div>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Link to='/' className='hidden h-10 items-center gap-2 border border-neutral-300 bg-white px-4 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-black sm:flex'>
              Về cửa hàng <ExternalLink className='h-3.5 w-3.5' />
            </Link>
            <div className='hidden border-l border-neutral-300 pl-4 md:block'>
              <p className='max-w-40 truncate text-xs font-bold'>{user?.name || 'Quản trị viên'}</p>
              <p className='max-w-40 truncate text-[10px] text-neutral-500'>{user?.email || 'Administrator'}</p>
            </div>
            <button type='button' onClick={handleLogout} disabled={loggingOut}
              className='grid h-10 w-10 place-items-center bg-black text-white transition hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-50'
              aria-label={loggingOut ? 'Đang đăng xuất' : 'Đăng xuất'} title='Đăng xuất'>
              <LogOut className='h-[18px] w-[18px]' />
            </button>
          </div>
        </header>
        <main className='min-h-[calc(100vh-73px)]'><Outlet /></main>
      </div>
    </div>
  )
}
