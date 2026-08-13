import { Boxes, Construction, Settings, Tags, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const icons = { products: Boxes, categories: Tags, customers: Users, settings: Settings }

export default function AdminPlaceholder({ type, eyebrow, title, description }) {
  const Icon = icons[type] || Construction
  return (
    <section className='px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10'>
      <div className='mx-auto max-w-[1360px]'>
        <div className='border-b border-black pb-6 sm:pb-8'>
          <p className='text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500'>{eyebrow}</p>
          <h2 className='mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl'>{title}</h2>
        </div>
        <div className='mt-6 grid min-h-[420px] place-items-center border border-neutral-200 bg-[#f8f8f8] px-6 py-16 text-center'>
          <div className='max-w-md'>
            <span className='mx-auto grid h-16 w-16 place-items-center bg-black text-white'><Icon className='h-7 w-7 stroke-[1.6]' /></span>
            <p className='mt-7 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500'>Đang phát triển</p>
            <h3 className='mt-2 text-2xl font-black uppercase'>Tính năng sắp ra mắt</h3>
            <p className='mt-3 text-sm leading-6 text-neutral-600'>{description}</p>
            <Link to='/admin' className='mt-7 inline-flex bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-neutral-700'>
              Về bảng điều khiển
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
