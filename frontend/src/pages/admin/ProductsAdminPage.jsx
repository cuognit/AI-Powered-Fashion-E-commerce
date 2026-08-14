import { Check, ChevronLeft, ChevronRight, Edit3, Loader2, PackageOpen, Plus, RefreshCw, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminProductDrawer from '../../components/admin/products/AdminProductDrawer.jsx'
import { listAdminAttributes, listAdminBrands, listAdminCategories, listAdminProducts, purgeAdminProduct, restoreAdminProduct, setAdminProductBusiness, trashAdminProduct } from '../../services/adminProductApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const statusMeta = { available: ['Đang bán', 'bg-emerald-100 text-emerald-800'], hidden: ['Tắt kinh doanh', 'bg-neutral-200 text-neutral-700'], out_of_stock: ['Hết hàng', 'bg-amber-100 text-amber-800'] }
const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'
const StatusBadge = ({ status }) => { const meta = statusMeta[status] || [status, 'bg-neutral-100']; return <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase ${meta[1]}`}>{meta[0]}</span> }

export default function ProductsAdminPage() {
  const [rows, setRows] = useState([]), [categories, setCategories] = useState([]), [brands, setBrands] = useState([]), [attributes, setAttributes] = useState([]), [summary, setSummary] = useState({ counts: {}, total: 0 }), [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1), [searchInput, setSearchInput] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState(''), [categoryId, setCategoryId] = useState(''), [brandId, setBrandId] = useState(''), [stock, setStock] = useState(''), [sort, setSort] = useState('newest'), [trash, setTrash] = useState(false)
  const [loading, setLoading] = useState(true), [editing, setEditing] = useState(undefined), [busyId, setBusyId] = useState('')
  const [selectedIds, setSelectedIds] = useState([]), [busyBulk, setBusyBulk] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listAdminProducts({ page, limit: 10, search: search || undefined, status: status || undefined, categoryId: categoryId || undefined, brandId: brandId || undefined, stock: stock || undefined, sort, trash })
      setRows(result.data || [])
      setPagination(result.pagination || { total: 0, totalPages: 1 })
      setSummary(result.summary || { counts: {}, total: 0 })
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setLoading(false)
    }
  }, [brandId, categoryId, page, search, sort, status, stock, trash])

  useEffect(() => { listAdminCategories({ page: 1, limit: 100 }).then((result) => setCategories(result.data || [])).catch(() => toast.error('Không thể tải danh mục')) }, [])
  useEffect(() => { Promise.all([listAdminBrands({ page: 1, limit: 100 }), listAdminAttributes({ page: 1, limit: 100 })]).then(([brandResult, attributeResult]) => { setBrands(brandResult.data || []); setAttributes(attributeResult.data || []) }).catch(() => toast.error('Không thể tải thương hiệu hoặc thuộc tính')) }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { setSelectedIds([]) }, [trash, status, categoryId, brandId, stock, sort, search, page])

  const toggle = async (product) => { setBusyId(product._id); try { await setAdminProductBusiness(product._id, !product.business_enabled); toast.success(product.business_enabled ? 'Đã tắt kinh doanh' : 'Đã bật kinh doanh'); await load() } catch (error) { toast.error(messageOf(error)) } finally { setBusyId('') } }
  const remove = async (product, permanent = false) => { if (!window.confirm(permanent ? `Xóa vĩnh viễn “${product.name}” và ảnh Cloudinary?` : `Chuyển “${product.name}” vào thùng rác?`)) return; setBusyId(product._id); try { permanent ? await purgeAdminProduct(product._id) : await trashAdminProduct(product._id); toast.success('Đã xử lý sản phẩm'); await load() } catch (error) { toast.error(messageOf(error)) } finally { setBusyId('') } }
  const restore = async (product) => { setBusyId(product._id); try { await restoreAdminProduct(product._id); toast.success('Đã khôi phục ở trạng thái tắt kinh doanh'); await load() } catch (error) { toast.error(messageOf(error)) } finally { setBusyId('') } }

  // Multi-select handlers
  const allSelected = rows.length > 0 && rows.every((p) => selectedIds.includes(p._id))
  const someSelected = rows.some((p) => selectedIds.includes(p._id)) && !allSelected
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : rows.map((p) => p._id))
  const toggleSelectOne = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  // Bulk actions
  const bulkToggleBusiness = async (enabled) => {
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => setAdminProductBusiness(id, enabled)))
      toast.success(`Đã ${enabled ? 'bật' : 'tắt'} kinh doanh cho ${selectedIds.length} sản phẩm`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  const bulkTrash = async () => {
    if (!window.confirm(`Chuyển ${selectedIds.length} sản phẩm đã chọn vào thùng rác?`)) return
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => trashAdminProduct(id)))
      toast.success(`Đã chuyển ${selectedIds.length} sản phẩm vào thùng rác`)
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
      await Promise.all(selectedIds.map((id) => restoreAdminProduct(id)))
      toast.success(`Đã khôi phục ${selectedIds.length} sản phẩm`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  const bulkPurge = async () => {
    if (!window.confirm(`CẢNH BÁO: Xóa vĩnh viễn ${selectedIds.length} sản phẩm và toàn bộ hình ảnh Cloudinary liên quan? Hành động này không thể hoàn tác!`)) return
    setBusyBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => purgeAdminProduct(id)))
      toast.success(`Đã xóa vĩnh viễn ${selectedIds.length} sản phẩm`)
      setSelectedIds([])
      await load()
    } catch (err) {
      toast.error(messageOf(err))
    } finally {
      setBusyBulk(false)
    }
  }

  const actions = (product) => trash ? <><button onClick={() => restore(product)} className='border p-2' title='Khôi phục'><RotateCcw className='h-4 w-4'/></button><button onClick={() => remove(product, true)} className='bg-red-700 p-2 text-white' title='Xóa vĩnh viễn'><Trash2 className='h-4 w-4'/></button></> : <><button onClick={() => setEditing(product)} className='border p-2'><Edit3 className='h-4 w-4'/></button><button onClick={() => remove(product)} className='border p-2 text-red-700'><Trash2 className='h-4 w-4'/></button></>

  return <section className='relative px-4 py-8 lg:px-8'><div className='mx-auto max-w-[1360px] pb-24'>
    <header className='flex flex-col justify-between gap-5 border-b border-black pb-6 lg:flex-row lg:items-end'><div><p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Danh mục hàng hóa</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Quản lý sản phẩm</h1><p className='mt-2 text-sm text-neutral-600'>{pagination.total} sản phẩm phù hợp</p></div><button onClick={() => setEditing(null)} className='flex items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-black uppercase text-white'><Plus className='h-4 w-4'/>Thêm sản phẩm</button></header>
    {!trash && <div className='mt-5 flex gap-2 overflow-x-auto'>{[['', 'Tất cả', summary.total], ['available', 'Đang bán', summary.counts?.available], ['hidden', 'Tắt kinh doanh', summary.counts?.hidden], ['out_of_stock', 'Hết hàng', summary.counts?.out_of_stock]].map(([value, label, count]) => <button key={value || 'all'} onClick={() => { setStatus(value); setPage(1) }} className={`shrink-0 border px-4 py-2 text-[10px] font-black uppercase ${status === value ? 'bg-black text-white' : 'bg-white'}`}>{label} ({count || 0})</button>)}</div>}
    <div className='mt-4 space-y-3 bg-white p-4'><div className='flex flex-col gap-3 xl:flex-row'><form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1) }} className='flex flex-1 border'><Search className='ml-3 mt-3 h-4 w-4'/><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className='min-w-0 flex-1 px-3 text-sm outline-none' placeholder='Tên, SKU hoặc thương hiệu...'/><button className='bg-black px-4 text-xs font-black uppercase text-white'>Tìm</button></form><select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }} className='border bg-white p-3 text-xs'><option value=''>Mọi danh mục</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><select value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1) }} className='border bg-white p-3 text-xs'><option value=''>Mọi thương hiệu</option>{brands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}</select><select value={stock} onChange={(event) => { setStock(event.target.value); setPage(1) }} className='border bg-white p-3 text-xs'><option value=''>Mọi tồn kho</option><option value='in'>Còn hàng</option><option value='out'>Hết hàng</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} className='border bg-white p-3 text-xs'><option value='newest'>Mới nhất</option><option value='oldest'>Cũ nhất</option><option value='name'>Tên A–Z</option><option value='price_asc'>Giá tăng dần</option><option value='price_desc'>Giá giảm dần</option></select></div><div className='flex items-center gap-3'><button onClick={() => { setSearchInput(''); setSearch(''); setStatus(''); setCategoryId(''); setBrandId(''); setStock(''); setSort('newest'); setPage(1) }} className='text-xs font-black uppercase text-neutral-500'>Xóa bộ lọc</button><button onClick={() => { setTrash((value) => !value); setStatus(''); setPage(1) }} className={`px-3 py-2 text-[10px] font-black uppercase ${trash ? 'bg-red-700 text-white' : 'border'}`}>{trash ? 'Đang xem thùng rác' : 'Thùng rác'}</button><button onClick={load} disabled={loading} className='ml-auto border p-2'><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></button></div></div>

    <div className='mt-5 overflow-hidden bg-white shadow-sm'>
      <div className='hidden overflow-x-auto lg:block'>
        <table className='w-full min-w-[1140px] text-left text-sm'>
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
                  title='Chọn tất cả trên trang này'
                />
              </th>
              <th className='p-4'>Sản phẩm</th>
              <th className='p-4'>Danh mục</th>
              <th className='p-4'>Giá</th>
              <th className='p-4'>Tồn kho</th>
              <th className='p-4'>Trạng thái</th>
              <th className='p-4'>Kinh doanh</th>
              <th className='p-4 text-right'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {loading ? (
              <tr><td colSpan='8' className='p-16 text-center'>Đang tải...</td></tr>
            ) : !rows.length ? (
              <tr><td colSpan='8' className='p-16 text-center'><PackageOpen className='mx-auto h-12 w-12 text-neutral-400'/><p className='mt-3 font-black uppercase'>Không có sản phẩm</p></td></tr>
            ) : (
              rows.map((product) => {
                const isSelected = selectedIds.includes(product._id)
                return (
                  <tr key={product._id} className={`hover:bg-neutral-50 transition ${isSelected ? 'bg-neutral-100/70' : ''}`}>
                    <td className='p-4 text-center' onClick={(e) => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => toggleSelectOne(product._id)}
                        className='h-4 w-4 accent-black cursor-pointer'
                      />
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-3'>
                        <img src={product.images?.[0]} alt='' className='h-16 w-12 bg-neutral-100 object-cover shrink-0'/>
                        <div className='max-w-xs'>
                          <b className='line-clamp-2'>{product.name}</b>
                          <p className='mt-1 text-[10px] text-neutral-500'>{product.variants?.[0]?.sku || 'Chưa có SKU'} · {product.brand || 'Không thương hiệu'}</p>
                        </div>
                      </div>
                    </td>
                    <td className='p-4'>{product.category_id?.name || 'Chưa phân loại'}</td>
                    <td className='p-4'>
                      <b>{formatCurrency(product.sale_price ?? product.base_price)}</b>
                      {product.sale_price != null && <p className='text-xs text-neutral-400 line-through'>{formatCurrency(product.base_price)}</p>}
                    </td>
                    <td className='p-4'>
                      <b>{product.total_stock}</b>
                      <p className='text-xs text-neutral-500'>{product.variants?.length || 0} biến thể</p>
                    </td>
                    <td className='p-4'><StatusBadge status={product.status}/></td>
                    <td className='p-4'>
                      <button
                        disabled={busyId === product._id || trash}
                        onClick={() => toggle(product)}
                        role='switch'
                        aria-checked={product.business_enabled}
                        className={`relative h-6 w-11 rounded-full disabled:opacity-30 transition ${product.business_enabled ? 'bg-emerald-600' : 'bg-neutral-300'}`}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${product.business_enabled ? 'left-6' : 'left-1'}`}/>
                      </button>
                    </td>
                    <td className='p-4'><div className='flex justify-end gap-2'>{actions(product)}</div></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List with Checkboxes */}
      <div className='divide-y lg:hidden'>
        {loading ? (
          <div className='p-12 text-center'>Đang tải...</div>
        ) : !rows.length ? (
          <div className='p-12 text-center'>Không có sản phẩm</div>
        ) : (
          rows.map((product) => {
            const isSelected = selectedIds.includes(product._id)
            return (
              <article key={product._id} className={`p-4 transition ${isSelected ? 'bg-neutral-100/70' : ''}`}>
                <div className='flex items-start gap-3'>
                  <input
                    type='checkbox'
                    checked={isSelected}
                    onChange={() => toggleSelectOne(product._id)}
                    className='mt-1 h-5 w-5 accent-black shrink-0 cursor-pointer'
                  />
                  <div className='flex gap-4 flex-1 min-w-0'>
                    <img src={product.images?.[0]} alt='' className='h-28 w-20 bg-neutral-100 object-cover shrink-0'/>
                    <div className='min-w-0 flex-1'>
                      <StatusBadge status={product.status}/>
                      <h3 className='mt-2 line-clamp-2 font-black'>{product.name}</h3>
                      <p className='mt-1 text-xs text-neutral-500'>{product.category_id?.name || 'Chưa phân loại'} · tồn {product.total_stock}</p>
                      <b className='mt-2 block'>{formatCurrency(product.sale_price ?? product.base_price)}</b>
                    </div>
                  </div>
                </div>
                <div className='mt-4 flex items-center justify-end gap-2 pt-2 border-t border-neutral-100'>
                  {!trash && <button onClick={() => toggle(product)} className='mr-auto text-xs font-black uppercase'>{product.business_enabled ? 'Tắt bán' : 'Bật bán'}</button>}
                  {actions(product)}
                </div>
              </article>
            )
          })
        )}
      </div>
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
      <span className='flex h-6 min-w-6 px-1.5 items-center justify-center bg-white text-black font-black text-xs transition-transform duration-200 scale-100'>
        {selectedIds.length}
      </span>
      <span className='text-xs font-bold whitespace-nowrap'>Đã chọn</span>
    </div>

    {!trash ? (
      (() => {
        const selectedRows = rows.filter((p) => selectedIds.includes(p._id))
        const canEnable = selectedRows.some((p) => !p.business_enabled)
        const canDisable = selectedRows.some((p) => p.business_enabled)

        return (
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              disabled={!canEnable || busyBulk}
              onClick={() => bulkToggleBusiness(true)}
              title={
                !canEnable
                  ? 'Tất cả sản phẩm được chọn đã ở trạng thái bật bán'
                  : `Bật kinh doanh cho ${selectedIds.length} sản phẩm`
              }
              className='bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Bật bán ({selectedIds.length})
            </button>
            <button
              type='button'
              disabled={!canDisable || busyBulk}
              onClick={() => bulkToggleBusiness(false)}
              title={
                !canDisable
                  ? 'Tất cả sản phẩm được chọn đã ở trạng thái tắt bán'
                  : `Tắt kinh doanh cho ${selectedIds.length} sản phẩm`
              }
              className='bg-neutral-700 hover:bg-neutral-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Tắt bán ({selectedIds.length})
            </button>
            <button
              type='button'
              disabled={busyBulk}
              onClick={bulkTrash}
              className='bg-red-700 hover:bg-red-600 px-3.5 py-2 text-xs font-black uppercase transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5'
            >
              <Trash2 className='h-3.5 w-3.5' /> Thùng rác
            </button>
          </div>
        )
      })()
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

  {editing !== undefined && <AdminProductDrawer key={editing?._id || 'new'} product={editing} categories={categories} brands={brands} attributes={attributes} onClose={() => setEditing(undefined)} onSaved={async () => { toast.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm'); setEditing(undefined); await load() }}/>}</section>
}

