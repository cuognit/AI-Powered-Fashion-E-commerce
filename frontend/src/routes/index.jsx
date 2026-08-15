import { createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import ManageCustomers from '../pages/admin/ManageCustomers.jsx'
import ManageOrders from '../pages/admin/ManageOrders.jsx'
import ManageProducts from '../pages/admin/ProductsAdminPage.jsx'
import ManageCategories from '../pages/admin/ManageCategories.jsx'
import ManageBrands from '../pages/admin/ManageBrands.jsx'
import ManageAttributes from '../pages/admin/ManageAttributes.jsx'
import AdminPlaceholder from '../components/admin/AdminPlaceholder.jsx'
import AuthPage from '../pages/auth/AuthPage.jsx'
import AITryOn from '../pages/shop/AITryOn.jsx'
import Cart from '../pages/shop/Cart.jsx'
import Checkout from '../pages/shop/Checkout.jsx'
import CatalogPage from '../pages/shop/CatalogPage.jsx'
import Home from '../pages/shop/Home.jsx'
import InfoPage from '../pages/shop/InfoPage.jsx'
import NewArrivals from '../pages/shop/NewArrivals.jsx'
import OrderHistory from '../pages/shop/OrderHistory.jsx'
import PaymentResult from '../pages/shop/PaymentResult.jsx'
import ProductDetail from '../pages/shop/ProductDetail.jsx'
import ProfilePage from '../pages/shop/ProfilePage.jsx'
import TrackOrder from '../pages/shop/TrackOrder.jsx'
import Wishlist from '../pages/shop/Wishlist.jsx'
import AdminRoute from './AdminRoute.jsx'
import CheckoutRoute from './CheckoutRoute.jsx'
import GuestRoute from './GuestRoute.jsx'
import PrivateRoute from './PrivateRoute.jsx'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/collections', element: <CatalogPage /> },
      { path: '/shop', element: <CatalogPage /> },
      { path: '/new-arrivals', element: <NewArrivals /> },
      { path: '/ai-try-on', element: <AITryOn /> },
      { path: '/products', element: <CatalogPage /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/privacy', element: <InfoPage title='Chính sách quyền riêng tư' description='Cách AESTHETIX bảo vệ dữ liệu và quyền riêng tư của bạn.' /> },
      { path: '/terms', element: <InfoPage title='Điều khoản dịch vụ' description='Điều khoản và điều kiện sử dụng nền tảng.' /> },
      { path: '/shipping', element: <InfoPage title='Thông tin giao hàng' description='Chi tiết dịch vụ giao hàng nhanh toàn quốc.' /> },
      { path: '/contact', element: <InfoPage title='Liên hệ' description='Kết nối với đội ngũ chăm sóc khách hàng của chúng tôi.' /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: '/cart', element: <Cart /> },
          { path: '/checkout', element: <CheckoutRoute><Checkout /></CheckoutRoute> },
          { path: '/payment/result', element: <PaymentResult /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/orders', element: <OrderHistory /> },
          { path: '/orders', element: <OrderHistory /> },
          { path: '/wishlist', element: <Wishlist /> },
          { path: '/track-order', element: <TrackOrder /> },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [{ element: <AuthLayout />, children: [{ path: '/login', element: <AuthPage /> }, { path: '/register', element: <AuthPage /> }] }],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [{
      element: <AdminLayout />,
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: 'products', element: <ManageProducts /> },
        { path: 'categories', element: <ManageCategories /> },
        { path: 'brands', element: <ManageBrands /> },
        { path: 'attributes', element: <ManageAttributes /> },
        { path: 'orders', element: <ManageOrders /> },
        { path: 'customers', element: <ManageCustomers /> },
        { path: 'settings', element: <AdminPlaceholder type='settings' eyebrow='Hệ thống' title='Cài đặt hệ thống' description='Cấu hình cửa hàng, vận chuyển, thanh toán và phân quyền sẽ được bổ sung tại đây.' /> },
      ],
    }],
  },
])

export default router
