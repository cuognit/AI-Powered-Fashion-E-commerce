import { createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import Cart from '../pages/shop/Cart.jsx'
import Checkout from '../pages/shop/Checkout.jsx'
import Home from '../pages/shop/Home.jsx'
import ProductDetail from '../pages/shop/ProductDetail.jsx'
import ProductList from '../pages/shop/ProductList.jsx'
import PrivateRoute from './PrivateRoute.jsx'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <ProductList /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/cart', element: <Cart /> },
      { element: <PrivateRoute />, children: [{ path: '/checkout', element: <Checkout /> }] },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    path: '/admin',
    element: <PrivateRoute />,
    children: [{ element: <AdminLayout />, children: [{ index: true, element: <AdminDashboard /> }] }],
  },
])

export default router
