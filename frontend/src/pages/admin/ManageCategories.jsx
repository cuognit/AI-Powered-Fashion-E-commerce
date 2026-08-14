import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createAdminCategory, listAdminCategories, purgeAdminCategory, restoreAdminCategory, trashAdminCategory, updateAdminCategory } from '../../services/adminProductApi.js'

const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'

export default function ManageCategories() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [trash, setTrash] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [busyBulk, setBusyBulk] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listAdminCategories({ page, limit: 10, trash, search: search || undefined })
      setRows(result.data || [])
      setPagination(result.pagination || { total: 0, totalPages: 1 })
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setLoading(false)
    }
  }, [page, search, trash])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelectedIds([]) }, [trash, search, page])

  const open = (category) => {
    setEditing(category || {})
    setForm(category ? { name: category.name, description: category.description || '' } : { name: '', description: '' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (editing?._id) await updateAdminCategory(editing._id, form)
      else await createAdminCategory(form)
      toast.success(editing?._id ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục')
      setEditing(null)
      await load()
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row, permanent = false) => {
    if (!window.confirm(permanent ? `Xóa vĩnh viễn danh mục “${row.name}”?` : `Chuyển “${row.name}” vào thùng rác?`)) return
    try {
      if (permanent) await purgeAdminCategory(row._id)
      else await trashAdminCategory(row._id)
      toast.success('Đã xử lý danh mục')
      await load()
    } catch (error) {
      toast.error(messageOf(error))
    }
  }

  const restore = async (row) => {
    try {
      await restoreAdminCategory(row._id)
      toast.success('Đã khôi phục danh mục')
      await load()
    } catch (error) {
      toast.error(messageOf(error))
    }
  }

  // Multi-select handlers
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r._id))
  const someSelected = rows.some((r) => selectedIds.includes(r._id)) && !allSelected
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r._id))
  const toggleSelectOne = (id) => setSelectedIds((curr) => curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id])

  // Bulk actions
  const bulkTrash = async () => {
    const selectedRows = rows.filter((r) => selectedIds.includes(r._id))
    const withProducts = selectedRows.filter((r) => r.product_count > 0)
    if (withProducts.length > 0) {
      toast.error(`Có ${withProducts.length} danh mục đang chứa sản phẩm, không thể xóa`)
      return
    }
    if (!window.confirm(`Chuyển ${selectedIds.length} danh mục đã chọn vào thùng rác?`)) return
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => trashAdminCategory(id)))
      toast.success(`Đã chuyển ${selectedIds.length} danh mục vào thùng rác`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  const bulkRestore = async () => {
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => restoreAdminCategory(id)))
      toast.success(`Đã khôi phục ${selectedIds.length} danh mục`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  const bulkPurge = async () => {
    if (!window.confirm(`Xóa vĩnh viễn ${selectedIds.length} danh mục đã chọn? Hành động này không thể hoàn tác!`)) return
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => purgeAdminCategory(id)))
      toast.success(`Đã xóa vĩnh viễn ${selectedIds.length} danh mục`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  return (
    <section className='relative px-4 py-8 lg:px-8'>
      <div className='mx-auto max-w-[1360px] pb-24'>
        <div className='flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end'>
          <div>
            <p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Cấu trúc cửa hàng</p>
            <h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Quản lý danh mục</h1>
          </div>
          <button onClick={() => open(null)} className='flex items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-black uppercase text-white'>
            <Plus className='h-4 w-4' />Thêm danh mục
          </button>
        </div>

        <div className='mt-5 flex flex-col gap-3 bg-white p-4 sm:flex-row'>
          <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1) }} className='flex flex-1 border'>
            <Search className='ml-3 mt-3 h-4 w-4'/>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className='min-w-0 flex-1 px-3 outline-none' placeholder='Tìm tên danh mục...'/>
            <button className='bg-black px-4 text-xs font-black uppercase text-white'>Tìm</button>
          </form>
          <button onClick={() => { setTrash((value) => !value); setPage(1) }} className={`px-4 py-3 text-xs font-black uppercase ${trash ? 'bg-red-700 text-white' : 'border'}`}>
            {trash ? 'Đang xem thùng rác' : 'Thùng rác'}
          </button>
          <button onClick={load} className='border p-3'>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        <div className='mt-5 overflow-x-auto bg-white shadow-sm'>
          <table className='w-full min-w-[760px] text-left text-sm'>
            <thead className='border-b bg-neutral-50 text-[10px] font-black uppercase'>
              <tr>
                <th className='p-4 w-12 text-center'>
                  <input
                    type='checkbox'
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleSelectAll}
                    disabled={!rows.length}
                    className='h-4 w-4 accent-black cursor-pointer'
                    title='Chọn tất cả'
                  />
                </th>
                <th className='p-4'>Danh mục</th>
                <th className='p-4'>Mô tả</th>
                <th className='p-4'>Sản phẩm</th>
                <th className='p-4 text-right'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {loading ? (
                <tr><td colSpan='5' className='p-12 text-center'>Đang tải...</td></tr>
              ) : !rows.length ? (
                <tr><td colSpan='5' className='p-12 text-center text-neutral-500'>Không có danh mục</td></tr>
              ) : (
                rows.map((row) => {
                  const isSelected = selectedIds.includes(row._id)
                  return (
                    <tr key={row._id} className={`hover:bg-neutral-50 transition ${isSelected ? 'bg-neutral-100/70' : ''}`}>
                      <td className='p-4 text-center' onClick={(e) => e.stopPropagation()}>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => toggleSelectOne(row._id)}
                          className='h-4 w-4 accent-black cursor-pointer'
                        />
                      </td>
                      <td className='p-4'>
                        <b>{row.name}</b>
                        <p className='text-xs text-neutral-400'>/{row.slug}</p>
                      </td>
                      <td className='max-w-md p-4 text-neutral-600'>{row.description || '—'}</td>
                      <td className='p-4 font-bold'>{row.product_count}</td>
                      <td className='p-4'>
                        <div className='flex justify-end gap-2'>
                          {trash ? (
                            <>
                              <button onClick={() => restore(row)} className='border p-2' title='Khôi phục'><RotateCcw className='h-4 w-4'/></button>
                              <button onClick={() => remove(row, true)} className='bg-red-700 p-2 text-white' title='Xóa vĩnh viễn'><Trash2 className='h-4 w-4'/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => open(row)} className='border p-2'><Pencil className='h-4 w-4'/></button>
                              <button disabled={row.product_count > 0} onClick={() => remove(row)} className='border p-2 text-red-700 disabled:opacity-30'><Trash2 className='h-4 w-4'/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className='mt-6 flex items-center justify-center gap-4'>
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className='bg-white p-2 disabled:opacity-30 border'><ChevronLeft/></button>
            <b className='text-xs'>Trang {page}/{pagination.totalPages}</b>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} className='bg-white p-2 disabled:opacity-30 border'><ChevronRight/></button>
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
        <div className='flex items-center gap-2 pr-3 border-r border-neutral-700'>
          <span className='flex h-6 min-w-6 px-1.5 items-center justify-center bg-white text-black font-black text-xs'>
            {selectedIds.length}
          </span>
          <span className='text-xs font-bold whitespace-nowrap'>Đã chọn</span>
        </div>

        {!trash ? (
          <div className='flex flex-wrap items-center gap-2'>
            {(() => {
              const selectedRows = rows.filter((r) => selectedIds.includes(r._id))
              const blockedTrashCount = selectedRows.filter((r) => (r.product_count || 0) > 0).length
              const canTrash = selectedRows.length > 0 && blockedTrashCount === 0

              return (
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={!canTrash || busyBulk}
                    onClick={bulkTrash}
                    title={
                      !canTrash
                        ? `Có ${blockedTrashCount} danh mục đang chứa sản phẩm, không thể xóa`
                        : `Chuyển ${selectedIds.length} danh mục vào thùng rác`
                    }
                    className='bg-red-700 hover:bg-red-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5'
                  >
                    <Trash2 className='h-3.5 w-3.5' /> Thùng rác ({selectedIds.length})
                  </button>
                  {!canTrash && (
                    <span className='text-[10px] text-amber-400 font-bold'>
                      ({blockedTrashCount} danh mục có sản phẩm)
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        ) : (
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              disabled={busyBulk}
              onClick={bulkRestore}
              className='bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-50 flex items-center gap-1.5'
            >
              <RotateCcw className='h-3.5 w-3.5' /> Khôi phục ({selectedIds.length})
            </button>
            <button
              type='button'
              disabled={busyBulk}
              onClick={bulkPurge}
              className='bg-red-700 hover:bg-red-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-50 flex items-center gap-1.5'
            >
              <Trash2 className='h-3.5 w-3.5' /> Xóa vĩnh viễn
            </button>
          </div>
        )}

        <button
          type='button'
          disabled={busyBulk}
          onClick={() => setSelectedIds([])}
          className='ml-2 text-xs text-neutral-400 hover:text-white underline uppercase font-bold transition disabled:opacity-50'
        >
          Bỏ chọn
        </button>

        {busyBulk && <Loader2 className='h-4 w-4 animate-spin text-white ml-1' />}
      </aside>

      {editing && (
        <div className='admin-drawer-backdrop fixed inset-0 z-[100] bg-black/55' onMouseDown={(event) => event.target === event.currentTarget && !busy && setEditing(null)}>
          <form onSubmit={submit} className='admin-drawer-panel absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white p-6 sm:p-8'>
            <div className='flex items-center justify-between'>
              <h2 className='text-2xl font-black uppercase'>{editing._id ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button type='button' onClick={() => setEditing(null)}>Đóng</button>
            </div>
            <label className='mt-8 block text-xs font-black uppercase'>
              Tên danh mục
              <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className='mt-2 w-full border p-3 text-sm font-normal normal-case' required minLength='2'/>
            </label>
            <label className='mt-5 block text-xs font-black uppercase'>
              Mô tả
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className='mt-2 min-h-32 w-full border p-3 text-sm font-normal normal-case'/>
            </label>
            <button disabled={busy} className='mt-8 w-full bg-black py-4 text-xs font-black uppercase text-white disabled:opacity-50'>
              {busy ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
