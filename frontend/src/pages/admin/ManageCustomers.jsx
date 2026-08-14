import {
  Check,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth.js'
import AdminCustomerDrawer from '../../components/admin/customers/AdminCustomerDrawer.jsx'
import AdminOrderDrawer from '../../components/admin/orders/AdminOrderDrawer.jsx'
import {
  UserRoleBadge,
  UserStatusBadge,
} from '../../components/admin/customers/UserBadges.jsx'
import { listAdminUsers, updateAdminUser } from '../../services/adminCustomerApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatOrderDate } from '../../utils/orderStatus.js'

const emptyPagination = { page: 1, totalPages: 1, total: 0 }
const sortOptions = [
  ['newest', 'Mới đăng ký'],
  ['oldest', 'Đăng ký lâu nhất'],
  ['name', 'Tên A–Z'],
  ['order_count', 'Nhiều đơn nhất'],
  ['total_spent', 'Chi tiêu cao nhất'],
]

const roleFilterOptions = [
  ['all', 'Tất cả vai trò'],
  ['customer', 'Khách hàng'],
  ['admin', 'Quản trị viên'],
]

const statusFilterOptions = [
  ['all', 'Mọi trạng thái'],
  ['active', 'Đang hoạt động'],
  ['inactive', 'Đã vô hiệu hóa'],
]

const messageOf = (error) =>
  error.response?.data?.message || 'Không thể tải danh sách người dùng'

function CustomerAvatar({ user }) {
  const label = user.name || user.email || 'U'
  const isAdmin = user.role === 'admin'
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center font-black text-white ${
        isAdmin ? 'bg-neutral-900 ring-2 ring-neutral-400' : 'bg-black'
      }`}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

function CustomerCards({ users, onSelect, selectedIds, onToggleSelect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
      {users.map((user) => {
        const isSelected = selectedIds.includes(user.id)
        return (
          <div
            key={user.id}
            onClick={() => onSelect(user)}
            className={`cursor-pointer bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg border border-neutral-100 ${
              isSelected ? 'bg-neutral-100/70 ring-1 ring-black' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div onClick={(e) => e.stopPropagation()} className="pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(user.id)}
                    className="h-4 w-4 accent-black cursor-pointer"
                  />
                </div>
                <CustomerAvatar user={user} />
                <div className="min-w-0">
                  <h3 className="truncate font-black">
                    {user.name || 'Chưa cập nhật tên'}
                  </h3>
                  <p className="truncate text-xs text-neutral-500">{user.email}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {user.phone || 'Chưa có số điện thoại'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge isActive={user.isActive} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 text-xs">
              <div>
                <span className="text-neutral-500">Tổng đơn</span>
                <b className="block text-base">{user.orderCount || 0}</b>
              </div>
              <div>
                <span className="text-neutral-500">Đang xử lý</span>
                <b className="block text-base">{user.activeOrders || 0}</b>
              </div>
              <div>
                <span className="text-neutral-500">Đã giao</span>
                <b className="block text-base">{user.completedOrders || 0}</b>
              </div>
              <div>
                <span className="text-neutral-500">Tổng chi tiêu</span>
                <b className="block">{formatCurrency(user.totalSpent || 0)}</b>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase text-neutral-400">
              Mua gần nhất: {formatOrderDate(user.latestOrderAt)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function CustomerTable({ users, onSelect, selectedIds, onToggleSelect, allSelected, someSelected, onToggleSelectAll }) {
  return (
    <div className="hidden overflow-x-auto bg-white shadow-xs border border-neutral-100 lg:block">
      <table className="w-full min-w-[1140px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-black uppercase tracking-[0.08em] text-neutral-600">
          <tr>
            <th className="p-4 w-12 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={onToggleSelectAll}
                disabled={!users.length}
                className="h-4 w-4 accent-black cursor-pointer"
                title="Chọn tất cả người dùng"
              />
            </th>
            <th className="p-4">Người dùng</th>
            <th className="p-4">Vai trò</th>
            <th className="p-4">Trạng thái</th>
            <th className="p-4">Điện thoại</th>
            <th className="p-4">Ngày tham gia</th>
            <th className="p-4">Đơn hàng</th>
            <th className="p-4">Tổng chi tiêu</th>
            <th className="p-4">Mua gần nhất</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id)
            return (
              <tr
                key={user.id}
                onClick={() => onSelect(user)}
                className={`cursor-pointer transition hover:bg-neutral-50 ${
                  isSelected ? 'bg-neutral-100/70' : ''
                }`}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(user)
                  }
                }}
              >
                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(user.id)}
                    className="h-4 w-4 accent-black cursor-pointer"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar user={user} />
                    <div className="min-w-0">
                      <b className="block max-w-56 truncate">
                        {user.name || 'Chưa cập nhật tên'}
                      </b>
                      <p className="max-w-56 truncate text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="p-4">
                  <UserStatusBadge isActive={user.isActive} />
                </td>
                <td className="p-4 text-xs font-mono">{user.phone || '—'}</td>
                <td className="p-4 text-xs text-neutral-600">
                  {formatOrderDate(user.createdAt)}
                </td>
                <td className="p-4">
                  <b>{user.orderCount || 0}</b>
                  <p className="text-[10px] text-neutral-500">
                    {user.completedOrders || 0} đã giao
                  </p>
                </td>
                <td className="p-4 font-black">
                  {formatCurrency(user.totalSpent || 0)}
                </td>
                <td className="p-4 text-xs text-neutral-600">
                  {formatOrderDate(user.latestOrderAt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ManageCustomers() {
  const { user: currentAdmin } = useAuth()
  const currentAdminId = String(currentAdmin?.id || currentAdmin?.sub || currentAdmin?._id || '')

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [busyBulk, setBusyBulk] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listAdminUsers({
        page,
        limit: 15,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status,
        sort,
        search: search || undefined,
      })
      setUsers(result.data || [])
      setPagination(result.pagination || emptyPagination)
    } catch (requestError) {
      setError(messageOf(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, role, search, sort, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setSelectedIds([])
  }, [page, role, status, sort, search])

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setRole('all')
    setStatus('all')
    setSort('newest')
    setPage(1)
  }

  const handleUserUpdated = (updatedUser) => {
    setSelected((current) =>
      current?.id === updatedUser.id ? { ...current, ...updatedUser } : current,
    )
    load()
  }

  // Multi-select handlers
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id))
  const someSelected = users.some((u) => selectedIds.includes(u.id)) && !allSelected
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : users.map((u) => u.id))
  const toggleSelectOne = (id) => setSelectedIds((curr) => curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id])

  // Bulk actions
  const bulkUpdateStatus = async (isActive) => {
    const selectedRows = users.filter((u) => selectedIds.includes(u.id))
    const targetUsers = isActive
      ? selectedRows.filter((u) => !u.isActive)
      : selectedRows.filter((u) => u.isActive && String(u.id) !== currentAdminId)

    if (targetUsers.length === 0) return

    if (!isActive) {
      if (
        !window.confirm(
          `Vô hiệu hóa ${targetUsers.length} tài khoản người dùng đã chọn? Các tài khoản này sẽ bị thu hồi toàn bộ phiên đăng nhập.`,
        )
      )
        return
    }

    setBusyBulk(true)
    try {
      await Promise.all(
        targetUsers.map((u) => updateAdminUser(u.id, { isActive })),
      )
      toast.success(
        `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} ${targetUsers.length} tài khoản`,
      )
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  return (
    <section className="relative px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-[1360px] pb-24">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
              Phân quyền & Tài khoản
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase sm:text-5xl">
              Quản lý người dùng
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-600">
              Tra cứu hồ sơ, phân quyền quản trị viên và kiểm soát trạng thái hoạt động của tài khoản người dùng.
            </p>
          </div>
          <div className="flex min-w-44 items-center gap-3 bg-black px-5 py-4 text-white">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-[9px] font-bold uppercase text-neutral-400">
                Tổng người dùng
              </p>
              <b className="text-xl">{pagination.total}</b>
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="mt-5 bg-white p-4 shadow-xs border border-neutral-100">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search form */}
            <form
              onSubmit={(event) => {
                event.preventDefault()
                setSearch(searchInput.trim())
                setPage(1)
              }}
              className="flex min-w-0 flex-1 border border-neutral-300"
            >
              <Search className="ml-3 mt-3 h-4 w-4 shrink-0 text-neutral-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={100}
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-black px-5 text-[10px] font-black uppercase text-white hover:bg-neutral-800 transition"
              >
                Tìm
              </button>
            </form>

            {/* Role Filter */}
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value)
                setPage(1)
              }}
              className="border border-neutral-300 bg-white p-3 text-xs font-bold outline-none"
              aria-label="Lọc theo vai trò"
            >
              {roleFilterOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="border border-neutral-300 bg-white p-3 text-xs font-bold outline-none"
              aria-label="Lọc theo trạng thái tài khoản"
            >
              {statusFilterOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              className="border border-neutral-300 bg-white p-3 text-xs font-bold outline-none"
              aria-label="Sắp xếp người dùng"
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-2 p-2 text-[10px] font-black uppercase text-neutral-500 hover:text-black transition"
            >
              <FilterX className="h-4 w-4" />
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="ml-auto border border-neutral-300 p-2 hover:bg-neutral-100 transition"
              aria-label="Tải lại danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Results summary */}
        <div className="my-5 flex items-center justify-between">
          <p className="text-xs font-bold">
            {pagination.total} người dùng phù hợp
          </p>
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:block">
            Chọn một tài khoản để xem chi tiết & phân quyền
          </p>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="h-80 animate-pulse bg-white border border-neutral-100" />
        ) : error ? (
          <div className="bg-white p-12 text-center text-red-600 border border-neutral-100">
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 bg-black px-5 py-2.5 text-[10px] font-black uppercase text-white"
            >
              Thử lại
            </button>
          </div>
        ) : !users.length ? (
          <div className="bg-white p-12 text-center border border-neutral-100">
            <UserRound className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-3 font-black uppercase">Không tìm thấy người dùng</p>
            <p className="mt-2 text-xs text-neutral-500">
              Thử thay đổi từ khóa, vai trò hoặc xóa bộ lọc.
            </p>
          </div>
        ) : (
          <>
            <CustomerCards
              users={users}
              onSelect={setSelected}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectOne}
            />
            <CustomerTable
              users={users}
              onSelect={setSelected}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectOne}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleSelectAll={toggleSelectAll}
            />
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="grid h-10 w-10 place-items-center bg-white border border-neutral-200 disabled:opacity-30"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-black">
              Trang {pagination.page}/{pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="grid h-10 w-10 place-items-center bg-white border border-neutral-200 disabled:opacity-30"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar with gentle slide-up animation */}
      <aside
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-3 bg-neutral-950/95 backdrop-blur-md text-white px-5 py-3.5 shadow-2xl border border-neutral-800 rounded-none max-w-[95vw] sm:max-w-none transition-all duration-300 ease-out ${
          selectedIds.length > 0
            ? 'translate-y-0 opacity-100 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
            : 'translate-y-12 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-700">
          <span className="flex h-6 min-w-6 px-1.5 items-center justify-center bg-white text-black font-black text-xs">
            {selectedIds.length}
          </span>
          <span className="text-xs font-bold whitespace-nowrap">Đã chọn</span>
        </div>

        {(() => {
          const selectedRows = users.filter((u) => selectedIds.includes(u.id))
          const inactiveUsers = selectedRows.filter((u) => !u.isActive)
          const activeUsers = selectedRows.filter((u) => u.isActive)
          const deactivatableUsers = selectedRows.filter(
            (u) => u.isActive && String(u.id) !== currentAdminId,
          )
          const hasSelf = selectedRows.some((u) => String(u.id) === currentAdminId)

          const canActivate = inactiveUsers.length > 0
          const canDeactivate = deactivatableUsers.length > 0

          let deactivateTitle = ''
          if (!canDeactivate) {
            if (hasSelf && selectedRows.length === 1) {
              deactivateTitle = 'Không thể tự vô hiệu hóa tài khoản của chính mình'
            } else if (activeUsers.length === 0) {
              deactivateTitle = 'Tất cả tài khoản được chọn đã bị vô hiệu hóa'
            } else {
              deactivateTitle = 'Không có tài khoản nào đủ điều kiện vô hiệu hóa'
            }
          } else {
            deactivateTitle = `Vô hiệu hóa ${deactivatableUsers.length} tài khoản`
          }

          return (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canActivate || busyBulk}
                onClick={() => bulkUpdateStatus(true)}
                title={
                  !canActivate
                    ? 'Tất cả tài khoản được chọn đã ở trạng thái đang hoạt động'
                    : `Kích hoạt ${inactiveUsers.length} tài khoản`
                }
                className="bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" /> Kích hoạt ({inactiveUsers.length})
              </button>
              <button
                type="button"
                disabled={!canDeactivate || busyBulk}
                onClick={() => bulkUpdateStatus(false)}
                title={deactivateTitle}
                className="bg-neutral-700 hover:bg-neutral-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <UserX className="h-3.5 w-3.5" /> Vô hiệu hóa ({deactivatableUsers.length})
              </button>
              {hasSelf && (
                <span className="text-[10px] text-amber-400 font-bold">
                  (Không bao gồm tài khoản của bạn)
                </span>
              )}
            </div>
          )
        })()}

        <button
          type="button"
          disabled={busyBulk}
          onClick={() => setSelectedIds([])}
          className="ml-2 text-xs text-neutral-400 hover:text-white underline uppercase font-bold transition disabled:opacity-50"
        >
          Bỏ chọn
        </button>

        {busyBulk && <Loader2 className="h-4 w-4 animate-spin text-white ml-1" />}
      </aside>

      {/* User Details & Permissions Drawer */}
      {selected && (
        <AdminCustomerDrawer
          key={selected.id}
          customer={selected}
          onClose={() => {
            setSelected(null)
            setSelectedOrder(null)
          }}
          onOrderSelect={setSelectedOrder}
          onUserUpdated={handleUserUpdated}
          escapeDisabled={Boolean(selectedOrder)}
        />
      )}

      {/* Nested Order Details Drawer */}
      {selectedOrder && (
        <AdminOrderDrawer
          key={selectedOrder.orderCode}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          readOnly
        />
      )}
    </section>
  )
}
