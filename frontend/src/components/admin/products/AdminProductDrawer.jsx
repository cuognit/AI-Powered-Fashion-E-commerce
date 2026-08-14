import { Check, ImagePlus, Loader2, Plus, Sparkles, Star, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { saveAdminProduct } from '../../../services/adminProductApi.js'
import { compressAndUploadToCloudinary } from '../../../services/cloudinaryUpload.js'

const cleanSku = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const legacyVariant = (variant = {}) => ({
  sku: variant.sku || '',
  option_values: variant.option_values || [],
  color: variant.color || '',
  size: variant.size || '',
  stock: variant.stock ?? 0,
  base_price: variant.base_price ?? '',
  sale_price: variant.sale_price ?? '',
  image_asset_ids: (variant.image_asset_ids || []).map(String),
})

const optionKey = (values = []) =>
  values
    .map((value) => `${value.attribute_id}:${value.value_id}`)
    .sort()
    .join('|')

function combinations(axes, attributes) {
  let rows = [[]]
  for (const axis of axes) {
    const attribute = attributes.find((item) => item._id === axis.attribute_id)
    const values = (axis.value_ids || [])
      .map((id) => attribute?.values.find((value) => value._id === id))
      .filter(Boolean)
    rows = rows.flatMap((row) =>
      values.map((value) => [
        ...row,
        {
          attribute_id: attribute._id,
          value_id: value._id,
          attribute_slug: attribute.slug,
          value_slug: value.slug,
          value_name: value.name,
        },
      ])
    )
  }
  return rows
}

export default function AdminProductDrawer({ product, categories, brands, attributes, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: product?.name || '',
    brand_id: product?.brand_id?._id || product?.brand_id || '',
    description: product?.description || '',
    category_id: product?.category_id?._id || product?.category_id || '',
    base_price: product?.base_price ?? '',
    sale_price: product?.sale_price ?? '',
    business_enabled: product?.business_enabled ?? true,
    option_axes: (product?.option_axes || []).map((axis) => ({
      attribute_id: String(axis.attribute_id),
      value_ids: axis.value_ids.map(String),
    })),
    variants: product?.variants?.length
      ? product.variants.map(legacyVariant)
      : [{ ...legacyVariant(), sku: '' }],
  }))

  const [images, setImages] = useState(() => {
    if (product?.image_assets?.length) {
      return product.image_assets.map((asset) => ({
        type: 'existing',
        id: String(asset._id || asset.url),
        url: asset.url,
        public_id: asset.public_id || null,
        file: null,
      }))
    }
    if (product?.images?.length) {
      return product.images.map((url, index) => ({
        type: 'existing',
        id: `legacy-${index}-${url}`,
        url,
        public_id: null,
        file: null,
      }))
    }
    return []
  })

  const [gallery, setGallery] = useState(() => {
    if (product?.gallery_asset_ids?.length) {
      return product.gallery_asset_ids.map(String)
    }
    if (product?.image_assets?.length) {
      return product.image_assets.slice(0, 5).map((asset) => String(asset._id || asset.url))
    }
    return (product?.images || []).slice(0, 5).map((url, index) => `legacy-${index}-${url}`)
  })

  const [busy, setBusy] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')

  const field = (name) => (event) =>
    setForm((current) => ({
      ...current,
      [name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }))

  const setAxisAttribute = (index, attributeId) =>
    setForm((current) => ({
      ...current,
      option_axes: current.option_axes.map((axis, position) =>
        position === index ? { attribute_id: attributeId, value_ids: [] } : axis
      ),
    }))

  const toggleAxisValue = (index, valueId) =>
    setForm((current) => ({
      ...current,
      option_axes: current.option_axes.map((axis, position) =>
        position === index
          ? {
              ...axis,
              value_ids: axis.value_ids.includes(valueId)
                ? axis.value_ids.filter((id) => id !== valueId)
                : [...axis.value_ids, valueId],
            }
          : axis
      ),
    }))

  const generate = () => {
    if (!form.option_axes.length || form.option_axes.some((axis) => !axis.attribute_id || !axis.value_ids.length)) {
      return setError('Mỗi nhóm thuộc tính phải có ít nhất một giá trị')
    }
    const combos = combinations(form.option_axes, attributes)
    if (combos.length > 100) return setError('Tối đa 100 tổ hợp cho mỗi sản phẩm')
    const old = new Map(form.variants.map((variant) => [optionKey(variant.option_values), variant]))
    const prefix =
      cleanSku(form.name)
        .split('-')
        .map((part) => part[0])
        .join('')
        .slice(0, 8) || 'SP'

    setForm((current) => ({
      ...current,
      variants: combos.map(
        (values, index) =>
          old.get(optionKey(values)) || {
            sku: `${prefix}-${values.map((value) => cleanSku(value.value_slug)).join('-') || index + 1}`,
            option_values: values,
            stock: 0,
            base_price: '',
            sale_price: '',
            image_asset_ids: [],
          }
      ),
    }))
    setError('')
  }

  const addFiles = (event) => {
    const files = Array.from(event.target.files || [])
    if (images.length + files.length > 30) {
      return setError('Tối đa 30 ảnh cho mỗi sản phẩm')
    }

    const added = files.map((file) => ({
      type: 'new',
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      url: URL.createObjectURL(file),
      public_id: null,
    }))

    setImages((current) => [...current, ...added])

    // Tự động bổ sung vào gallery nếu gallery chưa đủ 5 ảnh
    setGallery((current) => {
      const remainingSlots = Math.max(0, 5 - current.length)
      const toAdd = added.slice(0, remainingSlots).map((img) => img.id)
      return [...current, ...toAdd]
    })

    event.target.value = ''
    setError('')
  }

  const removeImage = (image) => {
    const ref = image.id
    if (image.type === 'new' && image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url)
    }

    setImages((current) => current.filter((item) => item.id !== ref))
    setGallery((current) => current.filter((id) => id !== ref))
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) => ({
        ...variant,
        image_asset_ids: (variant.image_asset_ids || []).filter((id) => id !== ref),
      })),
    }))
  }

  const toggleGallery = (ref) => {
    setGallery((current) =>
      current.includes(ref)
        ? current.filter((id) => id !== ref)
        : current.length < 5
        ? [...current, ref]
        : current
    )
  }

  const updateVariant = (index, key, value) =>
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, position) =>
        position === index ? { ...variant, [key]: value } : variant
      ),
    }))

  const toggleVariantImage = (index, ref) =>
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, position) =>
        position !== index
          ? variant
          : {
              ...variant,
              image_asset_ids: (variant.image_asset_ids || []).includes(ref)
                ? (variant.image_asset_ids || []).filter((id) => id !== ref)
                : (variant.image_asset_ids || []).length < 5
                ? [...(variant.image_asset_ids || []), ref]
                : variant.image_asset_ids,
            }
      ),
    }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!images.length) return setError('Sản phẩm cần có ít nhất một hình ảnh')
    if (!gallery.length) return setError('Vui lòng chọn ít nhất 1 ảnh làm ảnh chính (Gallery)')

    setBusy(true)

    try {
      // 1. Phân loại ảnh mới và ảnh đã có
      const newImages = images.filter((img) => img.type === 'new' && img.file)
      const uploadMap = new Map()

      // 2. Nén và Upload trực tiếp các ảnh mới lên Cloudinary
      if (newImages.length > 0) {
        setUploadStatus('Đang chuẩn bị nén và tải ảnh lên Cloudinary...')
        const uploadedAssets = await compressAndUploadToCloudinary(
          newImages.map((img) => img.file),
          (status) => setUploadStatus(status.message)
        )

        newImages.forEach((img, index) => {
          uploadMap.set(img.id, uploadedAssets[index])
        })
      }

      setUploadStatus('Đang lưu thông tin sản phẩm vào hệ thống...')

      // 3. Chuẩn hóa danh sách image_assets và ánh xạ ID
      const idToAssetMap = new Map()
      const finalImageAssets = images.map((img) => {
        if (img.type === 'new') {
          const uploaded = uploadMap.get(img.id)
          const assetObj = {
            url: uploaded.url,
            public_id: uploaded.public_id,
            client_key: img.id,
          }
          idToAssetMap.set(img.id, assetObj)
          return assetObj
        }

        const assetObj = {
          _id: img.id.startsWith('legacy-') ? undefined : img.id,
          url: img.url,
          public_id: img.public_id || null,
          client_key: img.id,
        }
        idToAssetMap.set(img.id, assetObj)
        return assetObj
      })

      // 4. Ánh xạ các tham chiếu gallery và SKU variant images sang URL / Asset ref
      const resolveAssetRef = (refId) => {
        const target = idToAssetMap.get(refId)
        return target ? target._id || target.url || target.client_key : refId
      }

      const resolvedGallery = gallery.map(resolveAssetRef).filter(Boolean)

      const payload = {
        ...form,
        base_price: Number(form.base_price),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        image_assets: finalImageAssets,
        gallery_asset_ids: resolvedGallery.length ? resolvedGallery : undefined,
        variants: form.variants.map((variant) => ({
          ...variant,
          stock: Number(variant.stock),
          base_price: variant.base_price === '' ? null : Number(variant.base_price),
          sale_price: variant.sale_price === '' ? null : Number(variant.sale_price),
          image_asset_ids: (variant.image_asset_ids || []).map(resolveAssetRef).filter(Boolean),
        })),
      }

      // 5. Gửi JSON thuần túy về Backend
      const result = await saveAdminProduct(product?._id, payload)
      onSaved(result)
    } catch (requestError) {
      console.error('Lỗi khi lưu sản phẩm:', requestError)
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Không thể lưu sản phẩm. Vui lòng kiểm tra lại.'
      )
    } finally {
      setBusy(false)
      setUploadStatus('')
    }
  }

  const count = form.option_axes.reduce(
    (total, axis) => total * Math.max(1, axis.value_ids.length),
    form.option_axes.length ? 1 : 0
  )

  return (
    <div className='fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs'>
      <form onSubmit={submit} className='absolute inset-y-0 right-0 w-full max-w-5xl overflow-y-auto bg-[#f5f5f2] shadow-2xl'>
        {/* Header */}
        <header className='sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-4'>
          <div>
            <span className='text-[10px] font-bold uppercase tracking-widest text-neutral-500'>
              {product ? 'Cập nhật danh mục' : 'Thêm mới'}
            </span>
            <h2 className='text-xl font-black uppercase text-neutral-950'>
              {product ? 'Chỉnh sửa' : 'Tạo'} sản phẩm
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={busy}
            className='grid h-9 w-9 place-items-center border border-neutral-300 hover:border-black transition disabled:opacity-40'
          >
            <X className='h-4 w-4' />
          </button>
        </header>

        <div className='space-y-5 p-6'>
          {/* Error banner */}
          {error && (
            <div className='border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-xs'>
              {error}
            </div>
          )}

          {/* Upload progress banner */}
          {busy && uploadStatus && (
            <div className='flex items-center gap-3 border border-indigo-200 bg-indigo-50 p-4 text-xs font-bold text-indigo-900 shadow-sm animate-pulse'>
              <Loader2 className='h-4 w-4 animate-spin text-indigo-600 shrink-0' />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* 1. Basic Info */}
          <section className='grid gap-4 bg-white p-5 md:grid-cols-2'>
            <label className='text-xs font-bold md:col-span-2'>
              Tên sản phẩm *
              <input
                required
                value={form.name}
                onChange={field('name')}
                placeholder='Ví dụ: Áo Sơ Mi Lụa Cổ V Thanh Lịch'
                className='mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-black'
              />
            </label>
            <label className='text-xs font-bold'>
              Danh mục *
              <select
                required
                value={form.category_id}
                onChange={field('category_id')}
                className='mt-2 w-full border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-black'
              >
                <option value=''>Chọn danh mục</option>
                {categories.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='text-xs font-bold'>
              Thương hiệu *
              <select
                required
                value={form.brand_id}
                onChange={field('brand_id')}
                className='mt-2 w-full border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-black'
              >
                <option value=''>Chọn thương hiệu</option>
                {brands.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='text-xs font-bold'>
              Giá chung (VND) *
              <input
                required
                type='number'
                min='0'
                step='1000'
                value={form.base_price}
                onChange={field('base_price')}
                placeholder='350000'
                className='mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-black'
              />
            </label>
            <label className='text-xs font-bold'>
              Giá KM chung (tùy chọn)
              <input
                type='number'
                min='0'
                step='1000'
                value={form.sale_price}
                onChange={field('sale_price')}
                placeholder='290000'
                className='mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-black'
              />
            </label>
            <label className='text-xs font-bold md:col-span-2'>
              Mô tả chi tiết
              <textarea
                value={form.description}
                onChange={field('description')}
                placeholder='Mô tả kiểu dáng, chất liệu, hướng dẫn bảo quản...'
                className='mt-2 min-h-28 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-black'
              />
            </label>
          </section>

          {/* 2. Media Library with Direct Upload & Compression */}
          <section className='bg-white p-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3'>
              <div>
                <h3 className='text-xs font-black uppercase text-neutral-900'>
                  Thư viện ảnh ({images.length}/30)
                </h3>
                <p className='text-[11px] text-neutral-500 mt-0.5'>
                  Bấm vào ảnh để bật/tắt làm ảnh chính (Gallery, tối đa 5 ảnh). Ảnh mới sẽ tự động nén trước khi tải lên.
                </p>
              </div>
              <label className='inline-flex cursor-pointer items-center gap-2 bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition'>
                <ImagePlus className='h-4 w-4' />
                <span>Thêm ảnh</span>
                <input
                  type='file'
                  multiple
                  accept='image/jpeg,image/png,image/webp'
                  onChange={addFiles}
                  className='hidden'
                  disabled={busy}
                />
              </label>
            </div>

            <div className='mt-4'>
              {images.length === 0 ? (
                <div className='flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 py-10 text-center'>
                  <ImagePlus className='h-8 w-8 text-neutral-400' />
                  <p className='mt-2 text-xs font-bold text-neutral-600'>Chưa có ảnh nào được chọn</p>
                  <p className='text-[10px] text-neutral-400'>Hỗ trợ định dạng JPG, PNG, WEBP</p>
                </div>
              ) : (
                <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'>
                  {images.map((image) => {
                    const isGallery = gallery.includes(image.id)
                    const galleryIndex = gallery.indexOf(image.id)

                    return (
                      <div
                        key={image.id}
                        className={`group relative aspect-square overflow-hidden border-2 transition ${
                          isGallery ? 'border-black ring-2 ring-black/20' : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <button
                          type='button'
                          onClick={() => toggleGallery(image.id)}
                          className='h-full w-full'
                          title={isGallery ? 'Bỏ chọn khỏi Gallery' : 'Chọn vào Gallery chính'}
                        >
                          <img src={image.url} alt='' className='h-full w-full object-cover' />
                        </button>

                        {/* Gallery Order Badge */}
                        {isGallery && (
                          <span className='pointer-events-none absolute left-1 top-1 flex h-5 w-5 items-center justify-center bg-black text-[9px] font-black text-white shadow'>
                            #{galleryIndex + 1}
                          </span>
                        )}

                        {/* New Tag */}
                        {image.type === 'new' && (
                          <span className='pointer-events-none absolute left-1 bottom-1 bg-amber-500 px-1 py-0.5 text-[8px] font-black uppercase text-white shadow-xs'>
                            Mới
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type='button'
                          onClick={() => removeImage(image)}
                          disabled={busy}
                          className='absolute right-1 top-1 grid h-6 w-6 place-items-center bg-red-600 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-700 disabled:opacity-0'
                          title='Xóa ảnh'
                        >
                          <Trash2 className='h-3 w-3' />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 3. Option Axes */}
          <section className='bg-white p-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3'>
              <div>
                <h3 className='text-xs font-black uppercase'>Nhóm thuộc tính ({form.option_axes.length}/4)</h3>
                <p className='text-[11px] text-neutral-500 mt-0.5'>{count} tổ hợp dự kiến · tối đa 100</p>
              </div>
              <div className='flex gap-2'>
                <button
                  type='button'
                  disabled={form.option_axes.length >= 4 || busy}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      option_axes: [...current.option_axes, { attribute_id: '', value_ids: [] }],
                    }))
                  }
                  className='border border-neutral-300 px-3 py-2 text-xs font-bold hover:border-black transition disabled:opacity-40'
                >
                  <Plus className='mr-1 inline h-3.5 w-3.5' />
                  Nhóm
                </button>
                <button
                  type='button'
                  onClick={generate}
                  disabled={busy}
                  className='bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-40'
                >
                  Sinh tổ hợp SKU
                </button>
              </div>
            </div>

            <div className='mt-4 space-y-4'>
              {form.option_axes.map((axis, index) => {
                const attribute = attributes.find((item) => item._id === axis.attribute_id)
                return (
                  <div key={index} className='border border-neutral-200 p-4 bg-neutral-50/50'>
                    <div className='flex gap-2'>
                      <select
                        value={axis.attribute_id}
                        onChange={(event) => setAxisAttribute(index, event.target.value)}
                        className='flex-1 border border-neutral-300 bg-white p-2 text-xs font-bold outline-none'
                      >
                        <option value=''>Chọn nhóm thuộc tính</option>
                        {attributes
                          .filter(
                            (item) =>
                              !form.option_axes.some(
                                (other, position) => position !== index && other.attribute_id === item._id
                              )
                          )
                          .map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type='button'
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            option_axes: current.option_axes.filter((_, position) => position !== index),
                          }))
                        }
                        className='grid h-9 w-9 place-items-center border border-neutral-300 bg-white text-red-600 hover:border-red-600'
                        title='Xóa nhóm'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>

                    {attribute && (
                      <div className='mt-3 flex flex-wrap gap-2 pt-2 border-t border-neutral-200/60'>
                        {attribute.values.map((value) => {
                          const active = axis.value_ids.includes(value._id)
                          return (
                            <button
                              type='button'
                              key={value._id}
                              onClick={() => toggleAxisValue(index, value._id)}
                              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition ${
                                active ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white text-neutral-800'
                              }`}
                            >
                              {value.color_hex && (
                                <span
                                  className='h-3 w-3 rounded-full border border-black/20'
                                  style={{ backgroundColor: value.color_hex }}
                                />
                              )}
                              <span>{value.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* 4. SKU Variants */}
          <section className='bg-white p-5'>
            <div className='border-b border-neutral-100 pb-3'>
              <h3 className='text-xs font-black uppercase'>Danh sách Biến thể SKU ({form.variants.length}/100)</h3>
              <p className='text-[11px] text-neutral-500 mt-0.5'>
                Quản lý mã SKU, tồn kho, giá bán riêng và chọn tối đa 5 ảnh đại diện cho từng biến thể.
              </p>
            </div>

            <div className='mt-4 space-y-4'>
              {form.variants.map((variant, index) => (
                <div key={optionKey(variant.option_values) || index} className='border border-neutral-200 p-4 bg-neutral-50/30'>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='inline-block bg-neutral-900 px-2.5 py-1 text-[10px] font-black uppercase text-white'>
                      {variant.option_values.map((value) => value.value_name).join(' / ') ||
                        `${variant.color || 'Màu'} / ${variant.size || 'Size'}`}
                    </span>
                    <span className='text-[10px] font-bold text-neutral-400'>
                      {(variant.image_asset_ids || []).length}/5 ảnh đã chọn
                    </span>
                  </div>

                  <div className='grid gap-2 sm:grid-cols-2 md:grid-cols-4'>
                    <label className='text-[10px] font-bold uppercase text-neutral-500'>
                      Mã SKU *
                      <input
                        required
                        value={variant.sku}
                        onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                        placeholder='SKU'
                        className='mt-1 w-full border border-neutral-300 bg-white p-2 text-xs font-bold uppercase outline-none focus:border-black'
                      />
                    </label>
                    <label className='text-[10px] font-bold uppercase text-neutral-500'>
                      Tồn kho *
                      <input
                        required
                        type='number'
                        min='0'
                        value={variant.stock}
                        onChange={(event) => updateVariant(index, 'stock', event.target.value)}
                        placeholder='0'
                        className='mt-1 w-full border border-neutral-300 bg-white p-2 text-xs font-bold outline-none focus:border-black'
                      />
                    </label>
                    <label className='text-[10px] font-bold uppercase text-neutral-500'>
                      Giá riêng (VND)
                      <input
                        type='number'
                        min='0'
                        step='1000'
                        value={variant.base_price}
                        onChange={(event) => updateVariant(index, 'base_price', event.target.value)}
                        placeholder='Kế thừa giá chung'
                        className='mt-1 w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black'
                      />
                    </label>
                    <label className='text-[10px] font-bold uppercase text-neutral-500'>
                      Giá KM riêng (VND)
                      <input
                        type='number'
                        min='0'
                        step='1000'
                        value={variant.sale_price}
                        onChange={(event) => updateVariant(index, 'sale_price', event.target.value)}
                        placeholder='Kế thừa giá KM'
                        className='mt-1 w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black'
                      />
                    </label>
                  </div>

                  {/* Variant Image Selector */}
                  <div className='mt-3 pt-3 border-t border-neutral-200/60'>
                    <span className='block text-[10px] font-bold uppercase text-neutral-500 mb-1.5'>
                      Chọn ảnh cho biến thể này:
                    </span>
                    <div className='flex gap-2 overflow-x-auto pb-1 custom-scrollbar'>
                      {images.map((image) => {
                        const selected = (variant.image_asset_ids || []).includes(image.id)
                        return (
                          <button
                            type='button'
                            key={image.id}
                            onClick={() => toggleVariantImage(index, image.id)}
                            className={`relative h-12 w-12 shrink-0 border-2 transition ${
                              selected ? 'border-black ring-2 ring-black/20' : 'border-neutral-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={image.url} alt='' className='h-full w-full object-cover' />
                            {selected && (
                              <span className='absolute inset-0 flex items-center justify-center bg-black/30 text-white'>
                                <Check className='h-3.5 w-3.5' />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Business Status Switch */}
          <label className='flex cursor-pointer items-center justify-between bg-white p-5 text-xs font-black uppercase'>
            <div>
              <span>Bật kinh doanh sản phẩm</span>
              <p className='text-[10px] font-normal text-neutral-500 normal-case mt-0.5'>
                Nếu tắt, sản phẩm sẽ ẩn khỏi cửa hàng và tìm kiếm.
              </p>
            </div>
            <input
              type='checkbox'
              checked={form.business_enabled}
              onChange={field('business_enabled')}
              className='h-5 w-5 accent-black'
            />
          </label>

          {/* Actions */}
          <div className='sticky bottom-0 z-20 flex gap-3 bg-[#f5f5f2] py-4 border-t border-neutral-200'>
            <button
              type='button'
              onClick={onClose}
              disabled={busy}
              className='flex-1 border border-neutral-300 bg-white py-4 text-xs font-bold uppercase hover:border-black transition disabled:opacity-50'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={busy}
              className='flex-[2] bg-black py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {busy ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>{uploadStatus || 'Đang xử lý...'}</span>
                </>
              ) : (
                <span>Lưu sản phẩm</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
