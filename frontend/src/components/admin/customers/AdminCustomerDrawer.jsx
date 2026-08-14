import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Unlock,
  UserCheck,
  UserRound,
  UserX,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useAuth from '../../../hooks/useAuth.js'
import OrderStatusBadge from '../../orders/OrderStatusBadge.jsx'
import {
  getAdminUser,
  listAdminUserOrders,
  updateAdminUser,
} from '../../../services/adminCustomerApi.js'
import { formatCurrency } from '../../../utils/formatCurrency.js'
import { formatOrderDate } from '../../../utils/orderStatus.js'
import { UserRoleBadge, UserStatusBadge } from './UserBadges.jsx'

const emptyPagination = { page: 1, totalPages: 1, total: 0 }
const messageOf = (error) =>
  error.response?.data?.message || error.message || 'Không thể xử lý yêu cầu'

function Statistic({ label, value, dark = false }) {
  return (
    <div className={dark ? 'bg-black p-4 text-white' : 'bg-white p-4'}>
      <p
        className={`text-[9px] font-bold uppercase tracking-[0.12em] ${
          dark ? 'text-neutral-400' : 'text-neutral-500'
        }`}
      >
        {label}
      </p>
      <b className="mt-1 block text-lg">{value}</b>
    </div>
  )
}

function DeactivateModal({
  isOpen,
  userName,
  onConfirm,
  onCancel,
  isProcessing,
}) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isProcessing) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isProcessing, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-dialog-title"
    >
      <div className="relative w-full max-w-md bg-white p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center bg-rose-100 text-rose-600 rounded-full">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="deactivate-dialog-title"
              className="text-base font-black uppercase text-neutral-950"
            >
              Vô hiệu hóa tài khoản
            </h3>
            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Bạn đang chuẩn bị vô hiệu hóa tài khoản{' '}
              <strong className="text-neutral-900 font-bold">{userName}</strong>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 border-y border-neutral-100 bg-neutral-50 p-3.5 text-xs text-neutral-600 space-y-1.5">
          <p className="font-bold text-neutral-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            Hệ quả khi tắt tài khoản:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-600">
            <li>
              Mọi phiên đăng nhập hiện có sẽ bị thu hồi và ngắt kết nối ngay lập
              tức.
            </li>
            <li>Từ chối các lượt đăng nhập và làm mới token trong tương lai.</li>
            <li>
              Lịch sử mua sắm và dữ liệu đơn hàng vẫn được lưu trữ đầy đủ.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="border border-neutral-300 bg-white px-4 py-2 text-xs font-bold uppercase transition hover:bg-neutral-100 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 bg-rose-600 px-4 py-2 text-xs font-black uppercase text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Xác nhận vô hiệu hóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCustomerDrawer({
  customer,
  onClose,
  onOrderSelect,
  onUserUpdated,
  escapeDisabled = false,
}) {
  const { user: currentAdmin } = useAuth()
  const currentAdminId = String(currentAdmin?.id || currentAdmin?.sub || '')

  const [closing, setClosing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)

  // Role & status state
  const [selectedRole, setSelectedRole] = useState(customer.role || 'customer')
  const [updatingRole, setUpdatingRole] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const isSelf = currentAdminId === String(customer.id)

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 220)
  }, [closing, onClose])

  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const data = await getAdminUser(customer.id)
      setProfile(data)
      setSelectedRole(data.role || 'customer')
    } catch (error) {
      setProfileError(messageOf(error))
    } finally {
      setProfileLoading(false)
    }
  }, [customer.id])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const result = await listAdminUserOrders(customer.id, {
        page,
        limit: 8,
        sort: 'newest',
      })
      setOrders(result.data || [])
      setPagination(result.pagination || emptyPagination)
    } catch (error) {
      setOrdersError(messageOf(error))
    } finally {
      setOrdersLoading(false)
    }
  }, [customer.id, page])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (escapeDisabled || showDeactivateModal) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [escapeDisabled, showDeactivateModal, requestClose])

  const details = profile || customer
  const statistics = profile?.statistics || customer
  const displayName = details.name || details.email || 'Người dùng'
  const isUserActive = details.isActive !== false

  const handleUpdateRole = async () => {
    if (selectedRole === details.role) return
    if (isSelf && selectedRole !== 'admin') {
      toast.error('Bạn không thể tự hạ quyền của chính mình')
      return
    }

    setUpdatingRole(true)
    try {
      const updated = await updateAdminUser(customer.id, { role: selectedRole })
      setProfile(updated)
      setSelectedRole(updated.role)
      toast.success(
        `Đã đổi quyền thành công sang ${
          updated.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'
        }`,
      )
      if (onUserUpdated) onUserUpdated(updated)
    } catch (error) {
      toast.error(messageOf(error))
      setSelectedRole(details.role || 'customer')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleToggleStatus = async (newStatus) => {
    if (isSelf && !newStatus) {
      toast.error('Bạn không thể tự vô hiệu hóa tài khoản của chính mình')
      return
    }

    setUpdatingStatus(true)
    try {
      const updated = await updateAdminUser(customer.id, {
        isActive: newStatus,
      })
      setProfile(updated)
      setShowDeactivateModal(false)
      toast.success(
        newStatus
          ? 'Đã kích hoạt lại tài khoản thành công'
          : 'Đã vô hiệu hóa tài khoản và thu hồi các phiên đăng nhập',
      )
      if (onUserUpdated) onUserUpdated(updated)
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <div
        className={`admin-drawer-backdrop fixed inset-0 z-[100] flex justify-end bg-black/55 ${
          closing ? 'is-closing' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết người dùng ${displayName}`}
      >
        <button
          type="button"
          className="admin-static-control absolute inset-0"
          onClick={requestClose}
          aria-label="Đóng chi tiết người dùng"
        />
        <aside className="admin-drawer-panel relative h-full w-full max-w-2xl overflow-y-auto bg-[#f4f2ed] p-5 shadow-2xl sm:p-8">
          <header className="flex items-start justify-between border-b border-black pb-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center bg-black text-xl font-black text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                    Hồ sơ người dùng
                  </p>
                  {isSelf && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-xs">
                      Tài khoản của bạn
                    </span>
                  )}
                </div>
                <h2 className="mt-1 truncate text-2xl font-black uppercase">
                  {displayName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <UserRoleBadge role={details.role} />
                  <UserStatusBadge isActive={details.isActive} />
                  <span className="text-xs text-neutral-500">
                    · Tham gia {formatOrderDate(details.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="grid h-10 w-10 shrink-0 place-items-center bg-white hover:bg-neutral-100 transition"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {profileLoading ? (
            <div className="mt-5 h-44 animate-pulse bg-white" />
          ) : profileError ? (
            <div className="mt-5 border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p>{profileError}</p>
              <button
                type="button"
                onClick={loadProfile}
                className="mt-3 inline-flex items-center gap-2 bg-black px-4 py-2 text-[10px] font-black uppercase text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Account Management: Role & Status */}
              <section className="mt-5 border border-neutral-300 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-neutral-800" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                      Phân quyền & Trạng thái
                    </h3>
                  </div>
                  {isSelf && (
                    <span className="text-[10px] text-amber-700 font-bold">
                      Không thể tự hạ quyền hoặc tự khóa
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Role Switcher */}
                  <div className="flex flex-col justify-between rounded-xs border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        Vai trò hệ thống
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Quản trị viên có toàn quyền thao tác dữ liệu và phân
                        quyền.
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <select
                        value={selectedRole}
                        disabled={updatingRole || (isSelf && details.role === 'admin')}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400"
                        aria-label="Chọn vai trò"
                      >
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>

                      <button
                        type="button"
                        disabled={
                          updatingRole ||
                          selectedRole === details.role ||
                          (isSelf && selectedRole !== 'admin')
                        }
                        onClick={handleUpdateRole}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 bg-black px-3.5 py-2 text-[10px] font-black uppercase text-white transition hover:bg-neutral-800 disabled:opacity-40"
                      >
                        {updatingRole ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                        Lưu
                      </button>
                    </div>
                  </div>

                  {/* Status Switcher */}
                  <div className="flex flex-col justify-between rounded-xs border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        Trạng thái hoạt động
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {isUserActive
                          ? 'Tài khoản đang hoạt động bình thường.'
                          : 'Tài khoản đang bị khóa, mọi phiên đăng nhập đã bị hủy.'}
                      </p>
                    </div>

                    <div className="mt-4">
                      {isUserActive ? (
                        <button
                          type="button"
                          disabled={updatingStatus || isSelf}
                          onClick={() => setShowDeactivateModal(true)}
                          className="inline-flex w-full items-center justify-center gap-2 border border-rose-300 bg-white px-4 py-2 text-xs font-black uppercase text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Vô hiệu hóa tài khoản
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleToggleStatus(true)}
                          className="inline-flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-emerald-800 disabled:opacity-40"
                        >
                          {updatingStatus ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                          Kích hoạt lại tài khoản
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Profile Details */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="bg-white p-5">
                  <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm font-bold">
                    {details.email || 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="bg-white p-5">
                  <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    <Phone className="h-4 w-4" />
                    Điện thoại
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {details.phone || 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="bg-white p-5 sm:col-span-2">
                  <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {details.address || 'Người dùng chưa cập nhật địa chỉ.'}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Statistic
                  label="Tổng đơn"
                  value={statistics.orderCount || 0}
                  dark
                />
                <Statistic
                  label="Đang xử lý"
                  value={statistics.activeOrders || 0}
                />
                <Statistic
                  label="Đã giao"
                  value={statistics.completedOrders || 0}
                />
                <Statistic
                  label="Tổng chi tiêu"
                  value={formatCurrency(statistics.totalSpent || 0)}
                />
              </div>
            </>
          )}

          {/* Orders Section */}
          <section className="mt-6">
            <div className="flex items-end justify-between border-b border-black pb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Hoạt động mua sắm
                </p>
                <h3 className="mt-1 text-lg font-black uppercase">
                  Lịch sử đơn hàng
                </h3>
              </div>
              <span className="text-xs font-bold">
                {pagination.total} đơn
              </span>
            </div>

            {ordersLoading ? (
              <div className="mt-4 h-64 animate-pulse bg-white" />
            ) : ordersError ? (
              <div className="mt-4 border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>{ordersError}</p>
                <button
                  type="button"
                  onClick={loadOrders}
                  className="mt-3 inline-flex items-center gap-2 bg-black px-4 py-2 text-[10px] font-black uppercase text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Thử lại
                </button>
              </div>
            ) : !orders.length ? (
              <div className="mt-4 bg-white p-10 text-center">
                <ShoppingBag className="mx-auto h-9 w-9 text-neutral-300" />
                <p className="mt-3 text-sm font-black uppercase">
                  Chưa có đơn hàng
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <article
                    key={order.orderCode}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOrderSelect(order)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOrderSelect(order)
                      }
                    }}
                    className="group cursor-pointer bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-black underline-offset-4 group-hover:underline">
                          {order.orderCode}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          {formatOrderDate(order.createdAt, true)} ·{' '}
                          {order.itemCount} sản phẩm
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-4 flex items-end justify-between border-t pt-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-neutral-400">
                          {order.paymentMethod}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {order.shippingAddress ||
                            'Không có địa chỉ giao hàng'}
                        </p>
                      </div>
                      <div className="text-right">
                        <b className="block">
                          {formatCurrency(order.totalAmount)}
                        </b>
                        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.08em] text-neutral-500">
                          Xem chi tiết
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1 || ordersLoading}
                  onClick={() => setPage((value) => value - 1)}
                  className="grid h-9 w-9 place-items-center bg-white disabled:opacity-30"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black">
                  Trang {pagination.page}/{pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages || ordersLoading}
                  onClick={() => setPage((value) => value + 1)}
                  className="grid h-9 w-9 place-items-center bg-white disabled:opacity-30"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>

      <DeactivateModal
        isOpen={showDeactivateModal}
        userName={displayName}
        isProcessing={updatingStatus}
        onCancel={() => setShowDeactivateModal(false)}
        onConfirm={() => handleToggleStatus(false)}
      />
    </>
  )
}
