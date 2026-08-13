import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WishlistSync from '../components/WishlistSync.jsx'

export default function MainLayout() {
  return (
    <div className='shop-shell flex min-h-screen flex-col bg-[#fafafa] font-sans text-gray-900 selection:bg-black selection:text-white'>
      <WishlistSync />
      <Header />
      <main className='flex-grow'>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
