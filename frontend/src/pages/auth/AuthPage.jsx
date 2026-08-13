import { motion } from 'framer-motion'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'

export default function AuthPage() {
  const { pathname } = useLocation()
  const [activePanel, setActivePanel] = useState(pathname === '/register' ? 'register' : 'login')

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f0eb] text-neutral-950">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#d8cbb9]/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-[#6b5949]/20 blur-3xl" />

      <header className="absolute inset-x-0 top-0 z-20 flex h-20 items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="text-xl font-black tracking-[0.2em] text-black">AESTHETIX</Link>
        <Link to="/" className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-600 transition hover:text-black">
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" /> Quay lại cửa hàng
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] items-center px-4 pb-6 pt-24 sm:px-6 lg:px-10">
        <div className="w-full overflow-hidden border border-black/10 bg-white shadow-[0_30px_90px_rgba(32,24,18,0.16)]">
          <div className="grid lg:grid-cols-2">
            <section className={`${activePanel === 'login' ? 'block' : 'hidden'} relative min-h-[660px] bg-[#f9f8f5] px-6 py-10 sm:px-12 lg:block lg:px-16 lg:py-14`}>
              <div className="absolute right-8 top-8 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 sm:flex"><span className="h-px w-8 bg-neutral-300" /> Thành viên</div>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex h-full max-w-md flex-col justify-center">
                <span className="mb-7 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white"><Check className="h-5 w-5" /></span>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">Chào mừng trở lại</p>
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Trở về với<br /><em className="font-normal">phong cách riêng.</em></h1>
                <p className="mb-8 mt-4 max-w-sm text-sm leading-6 text-neutral-500">Đăng nhập để tiếp tục khám phá bộ sưu tập, giỏ hàng và trải nghiệm thử đồ AI.</p>
                <Login />
                <button onClick={() => setActivePanel('register')} className="mt-7 text-center text-xs text-neutral-500 lg:hidden">Bạn mới đến AESTHETIX? <span className="font-bold text-black">Tạo tài khoản</span></button>
              </motion.div>
            </section>

            <section className={`${activePanel === 'register' ? 'block' : 'hidden'} relative min-h-[660px] overflow-hidden bg-[#151515] px-6 py-10 text-white sm:px-12 lg:block lg:px-16 lg:py-14`}>
              <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-5 top-5 h-44 w-44 rounded-full border border-white/10" />
              <div className="absolute right-8 top-8 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 sm:flex"><Sparkles className="h-3.5 w-3.5" /> Tài khoản mới</div>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative mx-auto flex h-full max-w-lg flex-col justify-center">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">Gia nhập cộng đồng</p>
                <h2 className="font-serif text-4xl leading-tight sm:text-5xl">Tạo dấu ấn,<br /><em className="font-normal text-neutral-400">theo cách của bạn.</em></h2>
                <p className="mb-6 mt-4 max-w-md text-sm leading-6 text-neutral-400">Tạo hồ sơ để nhận gợi ý cá nhân hóa và quyền tiếp cận sớm các bộ sưu tập giới hạn.</p>
                <div className="auth-dark-form"><Register /></div>
                <button onClick={() => setActivePanel('login')} className="mt-7 text-center text-xs text-neutral-400 lg:hidden">Đã là thành viên? <span className="font-bold text-white">Đăng nhập</span></button>
              </motion.div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
