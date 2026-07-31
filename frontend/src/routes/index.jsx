import { createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import AuthPage from '../pages/auth/AuthPage.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import Cart from '../pages/shop/Cart.jsx'
import Checkout from '../pages/shop/Checkout.jsx'
import Home from '../pages/shop/Home.jsx'
import ProductDetail from '../pages/shop/ProductDetail.jsx'
import Collections from '../pages/shop/Collections.jsx'
import NewArrivals from '../pages/shop/NewArrivals.jsx'
import AITryOn from '../pages/shop/AITryOn.jsx'
import InfoPage from '../pages/shop/InfoPage.jsx'
import AdminRoute from './AdminRoute.jsx'
import GuestRoute from './GuestRoute.jsx'
import PrivateRoute from './PrivateRoute.jsx'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/collections', element: <Collections /> },
      { path: '/new-arrivals', element: <NewArrivals /> },
      { path: '/ai-try-on', element: <AITryOn /> },
      { path: '/products', element: <Collections /> },
      { path: '/products/:id', element: <ProductDetail /> },
      
      { path: '/privacy', element: <InfoPage title="Privacy Policy" description="How AESTHETIX protects your data & privacy." /> },
      { path: '/terms', element: <InfoPage title="Terms of Service" description="Terms and conditions for using our platform." /> },
      { path: '/shipping', element: <InfoPage title="Shipping Info" description="Worldwide white-glove express delivery details." /> },
      { path: '/contact', element: <InfoPage title="Contact Us" description="Reach out to our concierge customer care team." /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: '/cart', element: <Cart /> },
          { path: '/checkout', element: <Checkout /> },
          { path: '/profile', element: <InfoPage title="My Profile" description="Manage your personal profile and AESTHETIX account preferences." /> },
          { path: '/orders', element: <InfoPage title="Order History" description="Review your purchases and their current status." /> },
          { path: '/wishlist', element: <InfoPage title="Wishlist" description="Browse the fashion pieces you have saved." /> },
          { path: '/track-order', element: <InfoPage title="Track an Order" description="Follow your order throughout its delivery journey." /> },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <AuthPage /> },
          { path: '/register', element: <AuthPage /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [{ element: <AdminLayout />, children: [{ index: true, element: <AdminDashboard /> }] }],
  },
])

export default router
