import { ArrowLeft, Info, MapPin, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AddressCard from '../../components/address-book/AddressCard.jsx'
import AddressForm from '../../components/address-book/AddressForm.jsx'
import DeleteAddressConfirm from '../../components/address-book/DeleteAddressConfirm.jsx'
import Button from '../../components/Button.jsx'
import useAddressBook from '../../hooks/useAddressBook.js'
import useAuth from '../../hooks/useAuth.js'
import { hasAddressChanged } from '../../components/address-book/addressSchema.js'
import { addressErrorMessage } from '../../utils/addressErrors.js'

function AddressBookContent({ ownerId }) {
  const { book, loading, loadError, saving, needsReload, pending, reload, addAddress, editAddress, removeAddress, makeDefault } = useAddressBook(ownerId)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const addButtonRef = useRef(null)
  const listHeadingRef = useRef(null)
  const focusReturnRef = useRef(null)
  const active = useRef(false)
  const focusFrameRef = useRef(null)
  const atLimit = book.count >= 20
  const listBlocked = loading || Boolean(loadError) || needsReload
  const editingMissing = editingAddress && !book.items.some((address) => address.id === editingAddress.id)
  const currentEditing = editingAddress && book.items.find((address) => address.id === editingAddress.id)
  const editingChanged = hasAddressChanged(editingAddress, currentEditing)
  const submitBlocked = listBlocked || Boolean(editingMissing) || editingChanged || (!editingAddress && atLimit)
  const deleteMissing = deleteTarget && !book.items.some((address) => address.id === deleteTarget.id)
  const currentDelete = deleteTarget && book.items.find((address) => address.id === deleteTarget.id)
  const deleteChanged = hasAddressChanged(deleteTarget, currentDelete, { includeDefault: true })

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current)
    }
  }, [])

  const restoreFocus = (trigger = focusReturnRef.current) => {
    if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current)
    focusFrameRef.current = requestAnimationFrame(() => {
      focusFrameRef.current = null
      if (!active.current) return
      if (trigger?.isConnected && !trigger.disabled) trigger.focus()
      else listHeadingRef.current?.focus()
    })
  }

  const openEditor = (address, trigger) => {
    focusReturnRef.current = trigger
    setEditingAddress(address)
    setFormOpen(true)
    setNotice('')
    setActionError('')
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingAddress(null)
    restoreFocus()
  }

  const replaceDraftWithLatest = () => {
    if (!currentEditing || listBlocked || saving) return
    // Chỉ thay bản nháp khi người dùng chủ động chọn bỏ bản cũ.
    setEditingAddress(currentEditing)
    setActionError('')
    setNotice('')
  }

  const saveAddress = async (values) => {
    const saved = editingAddress ? await editAddress(editingAddress.id, values) : await addAddress(values)
    if (saved) {
      closeForm()
      setNotice(editingAddress ? 'Đã cập nhật địa chỉ của bạn.' : 'Đã lưu địa chỉ vào tài khoản của bạn.')
    }
  }

  const openDelete = (address, trigger) => {
    focusReturnRef.current = trigger
    setDeleteTarget(address)
    setDeleteError('')
    setNotice('')
    setActionError('')
  }

  const cancelDelete = () => {
    setDeleteTarget(null)
    setDeleteError('')
    restoreFocus()
  }

  const confirmDelete = async () => {
    if (!deleteTarget || saving || listBlocked || deleteMissing || deleteChanged) return
    setDeleteError('')
    try {
      const saved = await removeAddress(deleteTarget.id)
      if (saved) {
        setDeleteTarget(null)
        setNotice('Đã xóa địa chỉ khỏi sổ địa chỉ.')
        restoreFocus()
      }
    } catch (error) {
      if (active.current) setDeleteError(addressErrorMessage(error, { mutation: true }))
    }
  }

  const chooseDefault = async (address, trigger) => {
    if (saving || listBlocked) return
    setActionError('')
    setNotice('')
    try {
      const saved = await makeDefault(address.id)
      if (saved) {
        setNotice('Đã đặt địa chỉ mặc định.')
        restoreFocus(trigger)
      }
    } catch (error) {
      if (active.current) setActionError(addressErrorMessage(error, { mutation: true }))
    }
  }

  return (
    <section aria-labelledby="address-book-title" className="min-h-[75vh] bg-[#f4f2ed] py-10">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-neutral-600 underline-offset-4 hover:text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về hồ sơ của tôi
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-neutral-500">Tài khoản</p>
            <h1 id="address-book-title" className="mt-2 text-3xl font-black uppercase sm:text-5xl">Sổ địa chỉ</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">Các địa chỉ giao hàng đã lưu trong tài khoản của bạn.</p>
          </div>
          <Button ref={addButtonRef} onClick={(event) => openEditor(null, event.currentTarget)} disabled={listBlocked || atLimit || (formOpen && !editingAddress) || saving || Boolean(deleteTarget)} className="inline-flex min-h-12 items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" /> Thêm địa chỉ mới
          </Button>
        </div>
        <aside aria-label="Thông tin sổ địa chỉ" className="mt-6 flex items-start gap-3 border border-neutral-300 bg-white p-4 text-sm leading-6 text-neutral-600">
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Sổ địa chỉ chưa đồng bộ với địa chỉ Checkout. Thay đổi ở đây không cập nhật thông tin giao hàng hoặc đơn hàng đã đặt.</p>
        </aside>
        {notice && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
        {actionError && <p role="alert" className="mt-4 text-sm text-red-700">{actionError}</p>}
        {needsReload && (
          <div role="alert" className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p>Địa chỉ có thể đã thay đổi hoặc kết quả thao tác chưa được xác nhận. Tải lại danh sách để đối chiếu trước khi thực hiện tiếp. Nội dung form được giữ nguyên.</p>
            <Button onClick={reload} disabled={loading || saving} className="mt-3 min-h-11 border border-amber-800 bg-white px-4 py-2 font-bold disabled:opacity-50">Tải lại danh sách</Button>
          </div>
        )}
        {atLimit && <p role="status" className="mt-4 text-sm text-neutral-600">Bạn đã lưu tối đa 20 địa chỉ.</p>}
        {formOpen && editingChanged && (
          <div role="alert" className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p>Địa chỉ này đã đổi sau khi mở form. Bản nháp vẫn được giữ và chưa được gửi lại. Hãy hủy hoặc chủ động nạp dữ liệu mới trước khi tiếp tục sửa.</p>
            <Button onClick={replaceDraftWithLatest} disabled={listBlocked || saving} className="mt-3 min-h-11 border border-amber-800 bg-white px-4 py-2 font-bold disabled:opacity-50">Dùng bản mới (bỏ bản nháp)</Button>
          </div>
        )}
        {formOpen && <AddressForm address={editingAddress} onSave={saveAddress} onCancel={closeForm} submitBlocked={submitBlocked} blockedMessage={editingMissing ? 'Địa chỉ không còn trong danh sách. Hãy hủy form và kiểm tra lại; nội dung đang sửa vẫn được giữ.' : editingChanged ? 'Cần đối chiếu bản mới trước khi gửi bản nháp đang sửa.' : atLimit && !editingAddress ? 'Bạn đã lưu tối đa 20 địa chỉ.' : undefined} />}
        <div className="my-6 flex flex-wrap items-center justify-between gap-3">
          <h2 ref={listHeadingRef} tabIndex={-1} className="text-sm font-bold uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4">Danh sách địa chỉ{!loading && !loadError && ` (${book.count})`}</h2>
        </div>
        {loading ? (
          <div role="status" className="bg-white p-8 text-center text-sm text-neutral-600">Đang tải sổ địa chỉ…</div>
        ) : loadError ? (
          <div role="alert" className="border border-red-200 bg-white p-6 text-center">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button onClick={reload} disabled={saving} className="mt-4 min-h-11 bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Thử lại</Button>
          </div>
        ) : book.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {book.items.map((address) => <AddressCard key={address.id} address={address} onEdit={openEditor} onDelete={openDelete} onSetDefault={chooseDefault} disabled={listBlocked || saving || Boolean(deleteTarget)} mutationDisabled={formOpen} defaultBusy={pending?.kind === 'default' && pending.addressId === address.id} />)}
          </div>
        ) : (
          <div className="border border-dashed border-neutral-300 bg-white px-5 py-12 text-center sm:py-16">
            <MapPin className="mx-auto h-10 w-10 text-neutral-400" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-bold">Chưa có địa chỉ nào</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">Chọn “Thêm địa chỉ mới” để lưu địa chỉ giao hàng đầu tiên vào tài khoản.</p>
          </div>
        )}
        {deleteTarget && <DeleteAddressConfirm key={deleteTarget.id} address={deleteTarget} busy={saving} blocked={listBlocked || Boolean(deleteMissing) || deleteChanged} blockedMessage={deleteChanged ? 'Thông tin hoặc trạng thái mặc định đã thay đổi. Hãy hủy và mở lại xác nhận với dữ liệu mới trước khi xóa.' : undefined} error={deleteError || loadError} needsReload={needsReload || Boolean(loadError)} loading={loading} onCancel={cancelDelete} onConfirm={confirmDelete} onReload={reload} />}
      </div>
    </section>
  )
}

export default function AddressBookPage() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user?.id) return null
  // Remount toàn bộ state/form ngay khi đổi tài khoản, không chờ effect xóa dữ liệu.
  return <AddressBookContent key={user.id} ownerId={user.id} />
}
