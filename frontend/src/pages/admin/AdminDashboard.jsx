import { ArrowUpRight, Boxes, PackageSearch, Settings, Tags, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const modules = [
  { title: 'Đơn hàng', description: 'Theo dõi xử lý, vận chuyển và hoàn tiền.', path: '/admin/orders', icon: PackageSearch, featured: true, status: 'Đang hoạt động' },
  { title: 'Sản phẩm', description: 'Quản lý danh mục hàng hóa và tồn kho.', path: '/admin/products', icon: Boxes, status: 'Sắp ra mắt' },
  { title: 'Danh mục', description: 'Tổ chức bộ sưu tập và nhóm sản phẩm.', path: '/admin/categories', icon: Tags, status: 'Sắp ra mắt' },
  { title: 'Khách hàng', description: 'Xem hồ sơ và lịch sử mua sắm.', path: '/admin/customers', icon: Users, status: 'Sắp ra mắt' },
  { title: 'Cài đặt', description: 'Cấu hình vận hành cửa hàng.', path: '/admin/settings', icon: Settings, status: 'Sắp ra mắt' },
]

export default function AdminDashboard() {
  return (
    <section className='px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10'>
      <div className='mx-auto max-w-[1360px]'>
        <div className='flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end sm:pb-8'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500'>AESTHETIX Administration</p>
            <h2 className='mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl'>Bảng điều khiển</h2>
            <p className='mt-3 max-w-xl text-sm leading-6 text-neutral-600'>Quản lý hoạt động cửa hàng và truy cập nhanh các khu vực vận hành.</p>
          </div>
          <div className='border-l-2 border-black pl-4'>
            <p className='text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Trạng thái hệ thống</p>
            <p className='mt-1 flex items-center gap-2 text-xs font-bold uppercase'><span className='h-2 w-2 rounded-full bg-emerald-500' />Hoạt động bình thường</p>
          </div>
        </div>

        <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.path} to={module.path}
                className={`group flex min-h-56 flex-col border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${module.featured ? 'border-black bg-black text-white' : 'border-neutral-200 bg-[#f8f8f8] text-black hover:border-black'}`}>
                <div className='flex items-start justify-between'>
                  <Icon className='h-8 w-8 stroke-[1.5]' />
                  <ArrowUpRight className='h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1' />
                </div>
                <div className='mt-auto pt-10'>
                  <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${module.featured ? 'text-neutral-400' : 'text-neutral-500'}`}>{module.status}</span>
                  <h3 className='mt-2 text-xl font-black uppercase'>{module.title}</h3>
                  <p className={`mt-2 text-sm leading-5 ${module.featured ? 'text-neutral-400' : 'text-neutral-600'}`}>{module.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
