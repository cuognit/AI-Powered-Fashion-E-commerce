import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Fingerprint, Box } from 'lucide-react'
import { LanguageModal, SecurityModal, ARModal } from './FooterModals'

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null) // 'lang' | 'security' | 'ar' | null

  const footerLinks = [
    { name: 'Chính sách quyền riêng tư', path: '/privacy' },
    { name: 'Điều khoản dịch vụ', path: '/terms' },
    { name: 'Thông tin giao hàng', path: '/shipping' },
    { name: 'Liên hệ', path: '/contact' },
  ]

  return (
    <footer className="w-full bg-[#f2f2f2] text-gray-900 pt-12 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto flex flex-col items-center">
        
        {/* Top: Brand Logo Centered (Clickable Link to Home) */}
        <Link 
          to="/" 
          className="group relative inline-block text-xl sm:text-2xl font-black tracking-widest text-black uppercase hover:opacity-85 transition mb-6 font-sans"
        >
          <span>AESTHETIX</span>
          <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
        </Link>

        {/* Middle: Footer Links Row with Left-to-Right Sliding Underline Hover Effect */}
        <nav className="flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-10 gap-y-3 mb-6 text-center">
          {footerLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group relative py-1 text-xs sm:text-sm font-semibold text-gray-700 hover:text-black transition tracking-wide"
            >
              <span>{link.name}</span>
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
            </Link>
          ))}
        </nav>

        {/* Subtle Horizontal Divider */}
        <div className="w-full border-t border-gray-300/80 my-6 sm:my-8 max-w-4xl" />

        {/* Copyright Text */}
        <p className="text-[11px] sm:text-xs text-gray-500 font-medium tracking-wider uppercase text-center mb-6">
          © 2024 AESTHETIX. BẢO LƯU MỌI QUYỀN.
        </p>

        {/* Bottom Centered Interactive Icons Trio */}
        <div className="flex items-center justify-center space-x-6 sm:space-x-8 text-black">
          <button
            onClick={() => setActiveModal('lang')}
            className="p-1 text-gray-800 hover:text-black transition transform hover:scale-110 cursor-pointer"
            title="Chọn ngôn ngữ và khu vực"
            aria-label="Chọn ngôn ngữ và khu vực"
          >
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
          </button>

          <button
            onClick={() => setActiveModal('security')}
            className="p-1 text-gray-800 hover:text-black transition transform hover:scale-110 cursor-pointer"
            title="Bảo mật AI và sinh trắc học"
            aria-label="Bảo mật AI và sinh trắc học"
          >
            <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
          </button>

          <button
            onClick={() => setActiveModal('ar')}
            className="p-1 text-gray-800 hover:text-black transition transform hover:scale-110 cursor-pointer"
            title="Công nghệ thử đồ 3D và AR"
            aria-label="Công nghệ thử đồ 3D và AR"
          >
            <Box className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
          </button>
        </div>

      </div>

      {/* Modals */}
      <LanguageModal 
        isOpen={activeModal === 'lang'} 
        onClose={() => setActiveModal(null)} 
      />
      <SecurityModal 
        isOpen={activeModal === 'security'} 
        onClose={() => setActiveModal(null)} 
      />
      <ARModal 
        isOpen={activeModal === 'ar'} 
        onClose={() => setActiveModal(null)} 
      />
    </footer>
  )
}
