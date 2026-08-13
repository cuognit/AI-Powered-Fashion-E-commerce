import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth'
import useCartStore from '../store/cartStore'
import UserDropdown from './UserDropdown'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredPath, setHoveredPath] = useState(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Scroll direction state
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const cartItems = useCartStore((state) => state.items)
  const fetchCart = useCartStore((state) => state.fetchCart)
  const resetCart = useCartStore((state) => state.resetCart)
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => {
    if (isAuthenticated) fetchCart().catch(() => {})
    else resetCart()
  }, [isAuthenticated, fetchCart, resetCart])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY <= 20) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Cuộn xuống dưới -> Ẩn Header
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Cuộn ngược lên trên -> Hiện Header
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Bộ sưu tập', path: '/collections' },
    { name: 'Hàng mới', path: '/new-arrivals' },
    { name: 'Thử đồ AI', path: '/ai-try-on' },
  ]

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className={`sticky top-0 z-50 w-full bg-[#f8f8f8]/95 backdrop-blur-md border-b border-gray-200/60 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left Group: Logo + Navigation Links */}
        <div className="flex items-center space-x-8 lg:space-x-12">
          <Link 
            to="/" 
            className="text-xl sm:text-2xl font-black tracking-wider text-black font-sans uppercase hover:opacity-85 transition shrink-0"
          >
            AESTHETIX
          </Link>

          {/* Desktop Navigation Links with Framer Motion Sliding Underline */}
          <nav 
            className="hidden md:flex items-center space-x-6 lg:space-x-10"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const isHovered = hoveredPath === item.path

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  className={`text-xs sm:text-sm font-semibold tracking-wide relative py-2.5 transition-colors ${
                    isActive ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.name}

                  {/* Active Link Sliding Underline */}
                  {isActive && (
                    <motion.span
                      layoutId="activeHeaderUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Hover Subtle Preview Line when hovering non-active tab */}
                  {!isActive && isHovered && (
                    <motion.span
                      layoutId="hoverHeaderUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gray-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Right Group: Search Input + Cart & Account Icons / Auth Link */}
        <div className="flex items-center space-x-5 sm:space-x-7">
          
          {/* Minimal Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative group">
            <Search className="w-4 h-4 text-gray-500 absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="TÌM SẢN PHẨM"
              className="pl-6 pr-2 py-1 text-[11px] sm:text-xs font-semibold tracking-widest text-gray-900 placeholder:text-gray-400 uppercase bg-transparent border-b border-gray-300 focus:border-black focus:outline-none w-36 md:w-52 lg:w-64 transition-all duration-200"
            />
          </form>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-1 text-black hover:text-gray-600 transition shrink-0"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* User Account Icon with Hover Menu OR Unauthenticated Left-to-Right Underline Link */}
          {isAuthenticated ? (
            <div
              className="relative shrink-0 py-2 m-0"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <Link
                to="/profile"
                className="p-1 text-black hover:text-gray-600 transition block cursor-pointer"
                aria-label="Hồ sơ người dùng"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </Link>

              {/* Hover Dropdown Menu */}
              <UserDropdown
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
              />
            </div>
          ) : (
            <Link
              to="/login"
              className="relative group py-1 text-xs sm:text-sm font-semibold tracking-wide text-gray-800 hover:text-black transition shrink-0"
            >
              <span>Đăng nhập / Đăng ký</span>
              {/* Left to right sliding underline animation */}
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-black hover:text-gray-600 transition cursor-pointer"
            aria-label="Mở hoặc đóng trình đơn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#f8f8f8] border-t border-gray-200 px-4 pt-4 pb-6 space-y-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2 stroke-[1.8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="TÌM SẢN PHẨM"
              className="w-full pl-8 pr-3 py-2 text-xs font-semibold tracking-widest text-gray-900 placeholder:text-gray-400 uppercase bg-white border border-gray-300 rounded-lg focus:border-black focus:outline-none"
            />
          </form>

          {/* Mobile Nav Links */}
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-wider uppercase py-2 border-b border-gray-200/50 ${
                    isActive ? 'text-black font-bold pl-2 border-l-2 border-l-black' : 'text-gray-600'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
