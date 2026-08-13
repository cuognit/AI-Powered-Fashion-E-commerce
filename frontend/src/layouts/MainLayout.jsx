import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WishlistSync from '../components/WishlistSync.jsx'

export default function MainLayout() {
  const { pathname } = useLocation()
  const isCatalogPage = ['/collections', '/shop', '/products'].includes(pathname)

  return (
    <div className={`${isCatalogPage ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white`}>
      <WishlistSync />
      <Header />
      <main className={`flex-grow ${isCatalogPage ? 'min-h-0 overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isCatalogPage && <Footer />}
    </div>
  )
}
