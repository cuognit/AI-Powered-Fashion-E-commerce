import { useEffect, useState, useCallback } from 'react'
import {
  ArrowUpRight,
  Boxes,
  Calendar,
  Layers,
  PackageSearch,
  RefreshCw,
  Settings,
  Tags,
  Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAdminAnalyticsOverview } from '../../services/adminAnalyticsApi.js'
import { listAdminOrders, updateAdminOrderStatus, completeAdminRefund } from '../../services/orderApi.js'
import DashboardKpiGrid from '../../components/admin/dashboard/DashboardKpiGrid.jsx'
import RevenueTrendChart from '../../components/admin/dashboard/RevenueTrendChart.jsx'
import OrderStatusDonutChart from '../../components/admin/dashboard/OrderStatusDonutChart.jsx'
import CategorySalesChart from '../../components/admin/dashboard/CategorySalesChart.jsx'
import PaymentShareChart from '../../components/admin/dashboard/PaymentShareChart.jsx'
import RecentOrdersTable from '../../components/admin/dashboard/RecentOrdersTable.jsx'
import TopProductsTable from '../../components/admin/dashboard/TopProductsTable.jsx'
import TopCustomersTable from '../../components/admin/dashboard/TopCustomersTable.jsx'
import LowStockWidget from '../../components/admin/dashboard/LowStockWidget.jsx'
import AdminOrderDrawer from '../../components/admin/orders/AdminOrderDrawer.jsx'

const timeRanges = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày qua' },
  { key: '30d', label: '30 ngày qua' },
  { key: 'month', label: 'Tháng này' },
  { key: 'year', label: 'Năm nay' },
]

const quickModules = [
  { title: 'Quản lý Đơn hàng', path: '/admin/orders', icon: PackageSearch, desc: 'Xử lý và vận chuyển' },
  { title: 'Quản lý Sản phẩm', path: '/admin/products', icon: Boxes, desc: 'Danh mục & biến thể' },
  { title: 'Danh mục hàng', path: '/admin/categories', icon: Tags, desc: 'Bộ sưu tập thời trang' },
  { title: 'Thuộc tính SP', path: '/admin/attributes', icon: Layers, desc: 'Size, màu sắc, chất liệu' },
  { title: 'Khách hàng', path: '/admin/customers', icon: Users, desc: 'Hồ sơ người dùng' },
  { title: 'Cài đặt hệ thống', path: '/admin/settings', icon: Settings, desc: 'Cấu hình chung' },
]

export default function AdminDashboard() {
  const [selectedRange, setSelectedRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isScrolled, setIsScrolled] = useState(false)

  // Modal detail states
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalBusy, setModalBusy] = useState(false)

  // Track scroll position for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchDashboardData = useCallback(async (range = selectedRange) => {
    setLoading(true)
    try {
      const response = await getAdminAnalyticsOverview(range)
      if (response?.success && response?.data) {
        setData(response.data)
      } else {
        setData(null)
      }
      setLastRefreshed(new Date())
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error)
      toast.error('Không thể tải dữ liệu thống kê bảng điều khiển')
    } finally {
      setLoading(false)
    }
  }, [selectedRange])

  useEffect(() => {
    fetchDashboardData(selectedRange)
  }, [selectedRange, fetchDashboardData])

  const handleRangeChange = (rangeKey) => {
    setSelectedRange(rangeKey)
  }

  // Open Order Drawer/Modal
  const handleOpenOrderDetail = async (orderItem) => {
    const code = orderItem.order_code || orderItem.orderCode
    try {
      const res = await listAdminOrders({ search: code })
      const fullOrder = res?.data?.find((o) => o.orderCode === code)
      if (fullOrder) {
        setSelectedOrder(fullOrder)
      } else {
        setSelectedOrder(orderItem)
      }
    } catch {
      setSelectedOrder(orderItem)
    }
  }

  // Update order status from Modal
  const handleUpdateOrderStatus = async (payload) => {
    if (!selectedOrder) return
    setModalBusy(true)
    try {
      const code = selectedOrder.orderCode || selectedOrder.order_code
      const updated = await updateAdminOrderStatus(code, payload)
      setSelectedOrder(updated)
      toast.success('Đã cập nhật trạng thái đơn hàng')
      fetchDashboardData(selectedRange)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật đơn hàng')
    } finally {
      setModalBusy(false)
    }
  }

  // Complete refund from Modal
  const handleCompleteRefund = async (payload) => {
    if (!selectedOrder) return
    setModalBusy(true)
    try {
      const code = selectedOrder.orderCode || selectedOrder.order_code
      const updated = await completeAdminRefund(code, payload)
      setSelectedOrder(updated)
      toast.success('Đã ghi nhận hoàn tiền')
      fetchDashboardData(selectedRange)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể ghi nhận hoàn tiền')
    } finally {
      setModalBusy(false)
    }
  }

  const selectedRangeLabel = timeRanges.find((r) => r.key === selectedRange)?.label

  return (
    <section className='px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 bg-[#ece9e2]/60 min-h-screen'>
      <div className='mx-auto max-w-[1400px] space-y-6'>
        {/* Top Title Banner */}
        <div className='border-b border-black pb-6 sm:pb-8 bg-white p-6 border shadow-xs'>
          <div className='flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
            <p className='text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500'>
              AESTHETIX Executive Commerce Insights
            </p>
          </div>
          <h1 className='mt-2 text-2xl font-black uppercase tracking-tight text-neutral-950 sm:text-4xl'>
            Bảng Điều Khiển & Phân Tích
          </h1>
          <p className='mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 font-medium'>
            Theo dõi doanh thu, hiệu suất đơn hàng và các chỉ số kinh doanh thời trang thời gian thực.
          </p>
        </div>

        {/* Sticky Filter & Action Bar with Smooth Sliding Pill and Floating Effect */}
        <div
          className={`sticky top-[73px] z-20 transition-all duration-300 ease-out ${
            isScrolled
              ? '-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 backdrop-blur-md shadow-md border-y border-neutral-300'
              : 'py-0'
          }`}
        >
          <div className={`mx-auto max-w-[1400px] flex flex-wrap items-center justify-between gap-3 ${
            !isScrolled ? 'bg-white p-4 border border-neutral-200' : ''
          }`}>
            <div className='flex items-center gap-2.5'>
              <span className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
              <div className='flex items-center gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-neutral-900'>
                  Khoảng thời gian:
                </span>
                <span className='text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded'>
                  {selectedRangeLabel}
                </span>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2.5'>
              {/* Sliding Pill Date Selector */}
              <div className='relative flex items-center rounded-sm border border-neutral-300 bg-neutral-100 p-1'>
                <Calendar className='h-3.5 w-3.5 mx-1.5 text-neutral-500 shrink-0 z-10' />
                {timeRanges.map((range) => {
                  const isSelected = selectedRange === range.key
                  return (
                    <button
                      key={range.key}
                      type='button'
                      onClick={() => handleRangeChange(range.key)}
                      className={`relative z-10 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                        isSelected ? 'text-white' : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId='activeTimeRangePill'
                          className='absolute inset-0 bg-black shadow-xs'
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className='relative z-10'>{range.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Refresh button */}
              <button
                type='button'
                onClick={() => fetchDashboardData(selectedRange)}
                disabled={loading}
                className='flex h-8 sm:h-9 items-center gap-1.5 border border-neutral-300 bg-white px-3 text-xs font-bold uppercase tracking-wider transition hover:border-black hover:bg-neutral-50 disabled:opacity-50 shadow-2xs'
                title='Làm mới dữ liệu'
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className='hidden sm:inline'>Làm mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <DashboardKpiGrid kpi={data?.kpi} loading={loading} />

        {/* Charts Row 1: Revenue Trend & Order Status */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          <div className='lg:col-span-8'>
            <RevenueTrendChart data={data?.charts?.timeSeriesTrend || []} loading={loading} />
          </div>
          <div className='lg:col-span-4'>
            <OrderStatusDonutChart data={data?.charts?.orderStatusBreakdown || []} loading={loading} />
          </div>
        </div>

        {/* Charts Row 2: Category Sales & Payment Methods */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          <div className='lg:col-span-7'>
            <CategorySalesChart data={data?.charts?.categorySales || []} loading={loading} />
          </div>
          <div className='lg:col-span-5'>
            <PaymentShareChart data={data?.charts?.paymentMethodBreakdown || []} loading={loading} />
          </div>
        </div>

        {/* Top Rankings Row: Top Products & Top Customers placed right next to each other */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <TopProductsTable products={data?.widgets?.topProducts || []} loading={loading} />
          <TopCustomersTable customers={data?.widgets?.topCustomers || []} loading={loading} />
        </div>

        {/* Actionable Recent Orders Table with Modal Detail trigger */}
        <div>
          <RecentOrdersTable
            orders={data?.widgets?.recentOrders || []}
            loading={loading}
            onSelectOrder={handleOpenOrderDetail}
          />
        </div>

        {/* Low Stock Alerts + Quick Modules Row */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <LowStockWidget products={data?.widgets?.lowStockProducts || []} loading={loading} />

          {/* Quick Access Grid */}
          <div className='border border-neutral-200 bg-white p-6'>
            <div className='border-b border-neutral-200 pb-4'>
              <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Vận hành nhanh</span>
              <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
                Truy Cập Nhanh Module
              </h3>
            </div>

            <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {quickModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link
                    key={mod.path}
                    to={mod.path}
                    className='group flex flex-col justify-between border border-neutral-200 bg-[#fbfbfb] p-4 transition hover:border-black hover:bg-black hover:text-white'
                  >
                    <div className='flex items-start justify-between'>
                      <Icon className='h-5 w-5 stroke-[1.7]' />
                      <ArrowUpRight className='h-4 w-4 opacity-50 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                    </div>
                    <div className='mt-4'>
                      <h4 className='text-xs font-black uppercase'>{mod.title}</h4>
                      <p className='text-[10px] text-neutral-500 group-hover:text-neutral-300 mt-0.5'>
                        {mod.desc}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className='flex items-center justify-between border-t border-neutral-300 pt-4 text-[10px] uppercase tracking-wider text-neutral-500'>
          <span>AESTHETIX Fashion Core Engine</span>
          <span>
            Cập nhật lần cuối: {lastRefreshed.toLocaleTimeString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Interactive Order Detail Modal/Drawer */}
      {selectedOrder && (
        <AdminOrderDrawer
          key={selectedOrder?.orderCode || selectedOrder?.order_code || 'none'}
          order={selectedOrder}
          busy={modalBusy}
          onClose={() => !modalBusy && setSelectedOrder(null)}
          onUpdate={handleUpdateOrderStatus}
          onRefund={handleCompleteRefund}
        />
      )}
    </section>
  )
}
