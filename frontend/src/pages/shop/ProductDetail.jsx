import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Minus, Plus, ShoppingBag, Sparkles, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import FavoriteButton from '../../components/FavoriteButton.jsx'
import { getProductById } from '../../services/productApi.js'
import { addReview, deleteReview, getReviewAiSummary, getReviewEligibility, getReviewsByProduct, updateReview } from '../../services/reviewApi.js'
import useAuth from '../../hooks/useAuth.js'
import useCartStore from '../../store/cartStore.js'

const stars = [1, 2, 3, 4, 5]
const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN')
const variantLabel = (variant) => [variant.color, variant.size, ...(variant.selectedOptions || []).map((option) => `${option.attribute_name}: ${option.value_name}`)].filter(Boolean).join(' · ')

function Stars({ value, interactive = false, onChange }) {
  return <div className='flex gap-1' aria-label={`${value} trên 5 sao`}>{stars.map((star) => <button key={star} type={interactive ? 'button' : undefined} disabled={!interactive} onClick={() => onChange?.(star)} className={interactive ? 'cursor-pointer' : 'cursor-default'}><Star size={18} fill={star <= value ? 'currentColor' : 'none'} className={star <= value ? 'text-amber-500' : 'text-zinc-300'} /></button>)}</div>
}

function ReviewSection({ productId }) {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const sectionRef = useRef(null)
  const requestedSku = searchParams.get('reviewSku') || ''
  const [reviewData, setReviewData] = useState({ reviews: [], summary: { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } })
  const [aiSummary, setAiSummary] = useState(null)
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)
  const [eligibleVariants, setEligibleVariants] = useState([])
  const [selectedReviewSku, setSelectedReviewSku] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const REVIEWS_PER_PAGE = 4

  const loadReviews = async () => {
    const { data } = await getReviewsByProduct(productId)
    setReviewData(data.data || data)
  }

  const loadAiSummary = async () => {
    try {
      setLoadingAiSummary(true)
      const { data } = await getReviewAiSummary(productId)
      if (data?.data) {
        setAiSummary(data.data)
      }
    } catch {
      // Bỏ qua lỗi AI summary một cách an toàn
    } finally {
      setLoadingAiSummary(false)
    }
  }

  const loadEligibility = async (focusSku = '') => {
    if (!isAuthenticated) {
      setEligibleVariants([])
      return
    }
    const { data } = await getReviewEligibility(productId)
    const variants = data.data?.variants || []
    setEligibleVariants(variants)
    const target = variants.find((variant) => variant.variantSku === focusSku) || variants[0]
    if (target) {
      setSelectedReviewSku(target.variantSku)
      if (target.review && focusSku === target.variantSku) {
        setEditingReview(target.review)
        setRating(target.review.rating)
        setContent(target.review.content)
      }
    }
  }

  useEffect(() => {
    loadReviews().catch(() => {})
    loadAiSummary().catch(() => {})
  }, [productId])
  useEffect(() => { loadEligibility(requestedSku).catch(() => setEligibleVariants([])) }, [productId, isAuthenticated, requestedSku])
  useEffect(() => { if (requestedSku && sectionRef.current) sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [requestedSku])

  const beginEdit = (variant) => {
    if (!variant.review) return
    setSelectedReviewSku(variant.variantSku)
    setEditingReview(variant.review)
    setRating(variant.review.rating)
    setContent(variant.review.content)
  }

  const cancelEdit = () => {
    setEditingReview(null)
    setRating(5)
    setContent('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!selectedReviewSku || !content.trim()) return toast.error('Vui lòng chọn biến thể và nhập nội dung đánh giá')
    setSubmitting(true)
    try {
      if (editingReview) {
        await updateReview(editingReview.id, { rating, content: content.trim() })
        toast.success('Đã cập nhật đánh giá')
      } else {
        await addReview({ productId, variantSku: selectedReviewSku, rating, content: content.trim() })
        toast.success('Đánh giá của bạn đã được đăng')
      }
      cancelEdit()
      await loadReviews()
      await loadEligibility()
      loadAiSummary().catch(() => {})
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (review) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này không?')) return
    setSubmitting(true)
    try {
      await deleteReview(review.id)
      toast.success('Đã xóa đánh giá')
      cancelEdit()
      await loadReviews()
      await loadEligibility()
      loadAiSummary().catch(() => {})
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const myVariants = eligibleVariants.filter((variant) => variant.review)
  const newVariants = eligibleVariants.filter((variant) => !variant.review)
  const { summary, reviews } = reviewData

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1
  const paginatedReviews = reviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE)

  return (
    <section ref={sectionRef} className='mx-auto mt-14 max-w-[1360px] scroll-mt-8 border-t border-zinc-200 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mb-10 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='mb-2 text-xs font-bold uppercase tracking-[.2em] text-zinc-500'>Cảm nhận khách hàng</p>
          <h2 className='text-3xl font-black uppercase'>Đánh giá sản phẩm</h2>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-4xl font-bold'>{summary.average.toFixed(1)}</span>
          <div>
            <Stars value={Math.round(summary.average)} />
            <p className='mt-1 text-xs text-zinc-500'>{summary.count} đánh giá</p>
          </div>
        </div>
      </div>

      <div className='grid gap-10 lg:grid-cols-[1fr_1.35fr] items-start'>
        <div className='space-y-6'>
          <div className='space-y-3 bg-zinc-50/70 p-5 rounded-xl border border-zinc-200/80'>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className='flex items-center gap-3 text-sm'>
                <span className='w-12 font-medium text-zinc-700'>{star} sao</span>
                <div className='h-2 flex-1 rounded-full bg-zinc-200 overflow-hidden'>
                  <div
                    className='h-full bg-amber-500 rounded-full transition-all duration-300'
                    style={{ width: `${summary.count ? (summary.distribution[star] / summary.count) * 100 : 0}%` }}
                  />
                </div>
                <span className='w-6 text-right text-xs font-semibold text-zinc-500'>{summary.distribution[star]}</span>
              </div>
            ))}
          </div>

          <div className='border border-zinc-200 bg-white p-5 rounded-xl shadow-xs'>
            <h3 className='text-sm font-black uppercase tracking-wider text-black'>
              {editingReview ? 'Sửa đánh giá của bạn' : myVariants.length ? 'Đánh giá của bạn' : 'Chia sẻ trải nghiệm'}
            </h3>

            {!isAuthenticated ? (
              <p className='mt-3 text-xs text-zinc-600 leading-relaxed'>
                Vui lòng <Link to='/login' className='font-bold text-black underline hover:text-amber-600'>đăng nhập</Link> để đánh giá sản phẩm này.
              </p>
            ) : (
              <>
                {myVariants.length > 0 && (
                  <div className='mt-4 space-y-3.5'>
                    {myVariants.map((variant) => (
                      <div key={variant.variantSku} className='rounded-lg border border-zinc-200 bg-zinc-50/50 p-3.5 text-xs'>
                        <div className='flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 pb-2'>
                          <span className='font-semibold text-zinc-700'>
                            {variantLabel(variant) || `SKU: ${variant.variantSku}`}
                          </span>
                          <div className='flex items-center gap-2'>
                            <Stars value={variant.review.rating} />
                            <span className='text-[10px] text-zinc-400 font-medium'>
                              {formatDate(variant.review.createdAt || variant.review.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <div className='mt-2.5 flex items-center justify-between gap-2'>
                          <span className='rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider'>
                            Đã đánh giá
                          </span>
                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              className='font-bold text-black underline hover:text-amber-600 cursor-pointer'
                              onClick={() => beginEdit(variant)}
                            >
                              Sửa
                            </button>
                            <button
                              type='button'
                              className='font-bold text-red-600 underline hover:text-red-700 cursor-pointer'
                              onClick={() => remove(variant.review)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {variant.review.content && (
                          <p className='mt-2 text-zinc-700 italic border-l-2 border-amber-400 pl-2 leading-relaxed'>
                            "{variant.review.content}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(editingReview || newVariants.length > 0) ? (
                  <form onSubmit={submit} className='mt-4 space-y-3.5 border-t border-zinc-100 pt-3.5'>
                    <div>
                      <label className='block text-xs font-semibold text-zinc-700'>Chọn biến thể bạn đã mua</label>
                      <select
                        disabled={Boolean(editingReview)}
                        value={selectedReviewSku}
                        onChange={(event) => {
                          setSelectedReviewSku(event.target.value)
                          setEditingReview(null)
                        }}
                        className='mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-black focus:outline-hidden disabled:bg-zinc-100'
                      >
                        {(editingReview ? eligibleVariants.filter((variant) => variant.variantSku === selectedReviewSku) : newVariants).map((variant) => (
                          <option key={variant.variantSku} value={variant.variantSku}>
                            {variantLabel(variant) || `SKU: ${variant.variantSku}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-xs font-semibold text-zinc-700'>Chất lượng sản phẩm</label>
                      <div className='mt-1.5'>
                        <Stars value={rating} interactive onChange={setRating} />
                      </div>
                    </div>

                    <div>
                      <label className='block text-xs font-semibold text-zinc-700'>Nội dung đánh giá</label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder='Chia sẻ cảm nhận về chất liệu, độ vừa vặn, form dáng...'
                        className='mt-1.5 w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:border-black focus:outline-hidden'
                      />
                    </div>

                    <div className='flex items-center justify-between pt-1'>
                      {editingReview ? (
                        <button
                          type='button'
                          onClick={cancelEdit}
                          className='text-xs font-bold text-zinc-600 underline hover:text-black cursor-pointer'
                        >
                          Hủy sửa
                        </button>
                      ) : <span />}

                      <div className='flex gap-2'>
                        <button
                          type='submit'
                          disabled={submitting}
                          className='rounded-lg bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50 cursor-pointer'
                        >
                          {submitting ? 'Đang lưu...' : editingReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : !myVariants.length ? (
                  <p className='mt-3 text-xs text-zinc-500 leading-relaxed'>
                    Bạn chưa có biến thể nào đã mua đủ điều kiện đánh giá. Hãy hoàn tất đơn hàng để chia sẻ trải nghiệm.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          {/* Trạng thái đang phân tích đánh giá bởi AI */}
          {loadingAiSummary && (
            <div className='rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-4.5 shadow-xs animate-pulse'>
              <div className='flex items-center gap-3'>
                <div className='grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs'>
                  <Sparkles size={16} className='animate-spin' />
                </div>
                <div className='space-y-0.5'>
                  <h4 className='text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-2'>
                    <span>Fashion AI đang phân tích đánh giá...</span>
                    <span className='inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping' />
                  </h4>
                  <p className='text-[11px] text-amber-800/80'>Đang tổng hợp ưu nhược điểm, độ vừa vặn và lời khuyên chọn size từ khách hàng thực tế</p>
                </div>
              </div>
            </div>
          )}

          {/* Khối AI Tóm tắt Đánh giá Thực tế */}
          {!loadingAiSummary && aiSummary?.hasSummary && (
            <div className='rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white p-5 shadow-xs transition-all'>
              <div className='flex items-center justify-between gap-2 border-b border-amber-200/60 pb-3'>
                <div className='flex items-center gap-2'>
                  <div className='grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-white shadow-xs'>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className='text-xs font-black uppercase tracking-wider text-amber-950'>AI Tóm tắt Đánh giá Thực tế</h4>
                    <p className='text-[11px] text-amber-800/80'>Tổng hợp từ {aiSummary.count} nhận xét của khách hàng đã mua</p>
                  </div>
                </div>
                <span className='rounded-full bg-amber-200/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-900'>
                  AI Insights
                </span>
              </div>

              <p className='mt-3 text-xs leading-relaxed text-zinc-800 font-medium'>
                {aiSummary.overview}
              </p>

              <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {/* Ưu điểm nổi bật */}
                {aiSummary.pros?.length > 0 && (
                  <div className='rounded-xl bg-white/90 p-3 border border-emerald-100 shadow-2xs'>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-emerald-800'>
                      <ThumbsUp size={13} className='text-emerald-600' />
                      <span>Điểm nổi bật</span>
                    </div>
                    <ul className='mt-2 space-y-1.5 text-[11px] text-zinc-700'>
                      {aiSummary.pros.map((pro, pIdx) => (
                        <li key={pIdx} className='flex items-start gap-1.5'>
                          <span className='mt-0.5 text-emerald-600 font-bold'>✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Nhược điểm / Điểm cần lưu ý */}
                {aiSummary.cons?.length > 0 && (
                  <div className='rounded-xl bg-white/90 p-3 border border-rose-100 shadow-2xs'>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-rose-800'>
                      <ThumbsDown size={13} className='text-rose-600' />
                      <span>Điểm trừ / Cần lưu ý</span>
                    </div>
                    <ul className='mt-2 space-y-1.5 text-[11px] text-zinc-700'>
                      {aiSummary.cons.map((con, cIdx) => (
                        <li key={cIdx} className='flex items-start gap-1.5'>
                          <span className='mt-0.5 text-rose-500 font-bold'>!</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lời khuyên chọn Size & Form dáng */}
                {aiSummary.sizeAdvice?.length > 0 && (
                  <div className='rounded-xl bg-white/90 p-3 border border-blue-100 shadow-2xs'>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-blue-900'>
                      <Lightbulb size={13} className='text-blue-600' />
                      <span>Lời khuyên chọn Size</span>
                    </div>
                    <ul className='mt-2 space-y-1.5 text-[11px] text-zinc-700'>
                      {aiSummary.sizeAdvice.map((advice, aIdx) => (
                        <li key={aIdx} className='flex items-start gap-1.5'>
                          <span className='mt-0.5 text-blue-600 font-bold'>•</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='divide-y divide-zinc-200 border-t border-zinc-200'>
            {paginatedReviews.length ? (
              paginatedReviews.map((review) => (
                <article key={review.id} className='py-5 first:pt-0'>
                  <div className='flex flex-wrap items-start justify-between gap-2'>
                    <div>
                      <p className='font-bold text-sm text-zinc-900'>{review.user.name}</p>
                      <div className='mt-1 flex items-center gap-3'>
                        <Stars value={review.rating} />
                        <time className='text-xs text-zinc-400 font-medium'>{formatDate(review.createdAt)}</time>
                      </div>
                    </div>
                    <span className='rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600'>
                      {[
                        review.color && `Màu: ${review.color}`,
                        review.size && `Size: ${review.size}`,
                        ...(review.selectedOptions || []).map((option) => `${option.attribute_name}: ${option.value_name}`),
                      ].filter(Boolean).join(' · ') || `SKU: ${review.variantSku}`}
                    </span>
                  </div>
                  <p className='mt-3 text-sm leading-relaxed text-zinc-700'>{review.content}</p>
                </article>
              ))
            ) : (
              <p className='py-8 text-sm text-zinc-500'>Sản phẩm chưa có đánh giá nào.</p>
            )}
          </div>

          {/* Phân trang đánh giá */}
          {totalPages > 1 && (
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5'>
              <span className='text-xs text-zinc-500 font-medium'>
                Hiển thị {(page - 1) * REVIEWS_PER_PAGE + 1} - {Math.min(page * REVIEWS_PER_PAGE, reviews.length)} trong {reviews.length} đánh giá
              </span>

              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'
                  aria-label='Trang trước'
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type='button'
                    onClick={() => setPage(num)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
                      page === num
                        ? 'bg-black text-white shadow-xs'
                        : 'border border-zinc-300 bg-white text-zinc-700 hover:border-black hover:text-black'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type='button'
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'
                  aria-label='Trang sau'
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function ProductDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [selectedSku, setSelectedSku] = useState('')
  const [selected, setSelected] = useState({})
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const isMutating = useCartStore((state) => state.isMutating)

  useEffect(() => {
    let active = true
    getProductById(id)
      .then(({ data }) => {
        if (!active) return
        const p = data.data || data
        setProduct(p)
        if (p?.variants?.length) {
          const firstValid = p.variants.find((item) => item.stock > 0) || p.variants[0]
          if (firstValid) {
            setSelectedSku(firstValid.sku)
            if (firstValid.option_values?.length) {
              const opts = {}
              firstValid.option_values.forEach((opt) => { opts[String(opt.attribute_id)] = String(opt.value_id) })
              setSelected(opts)
            }
          }
        }
      })
      .catch(() => active && setError('Không thể tải sản phẩm'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const variant = useMemo(() => product?.variants?.find((item) => item.sku === selectedSku), [product, selectedSku])
  if (loading) return <div className='grid min-h-[60vh] place-items-center'>Đang tải sản phẩm...</div>
  if (error || !product) return <div className='grid min-h-[60vh] place-items-center text-red-600'>{error || 'Không tìm thấy sản phẩm'}</div>
  const images = variant?.images?.length ? variant.images : product.images?.length ? product.images : ['https://placehold.co/800x1000?text=Product']
  const price = variant?.effective_price ?? product.min_price ?? product.sale_price ?? product.base_price

  const choose = (attributeId, valueId) => {
    const next = { ...selected, [attributeId]: valueId }
    setSelected(next)
    setQuantity(1)
    const match = product.variants.find((item) => item.option_values?.every((option) => next[String(option.attribute_id)] === String(option.value_id)))
    setSelectedSku(match ? match.sku : '')
    setImageIndex(0)
  }

  const available = (attributeId, valueId) => product.variants.some((item) => item.stock > 0 && item.option_values?.some((option) => String(option.attribute_id) === attributeId && String(option.value_id) === valueId) && item.option_values.every((option) => String(option.attribute_id) === attributeId || !selected[String(option.attribute_id)] || selected[String(option.attribute_id)] === String(option.value_id)))

  const add = async () => {
    if (!variant) return toast.error('Vui lòng chọn đầy đủ thuộc tính sản phẩm')
    if (variant.stock < 1) return toast.error('Sản phẩm hiện đang hết hàng')
    if (quantity > variant.stock) return toast.error('Số lượng không hợp lệ')
    try {
      await addItem(product._id, variant.sku, quantity)
      toast.success('Đã thêm sản phẩm vào giỏ hàng')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể thêm vào giỏ')
    }
  }

  return (
    <main className='min-h-screen bg-[#f7f6f4] py-8 text-zinc-900'>
      <div className='mx-auto max-w-[1360px] px-4 pb-6 sm:px-6 lg:px-8'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='inline-flex items-center gap-2 border border-zinc-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 shadow-sm transition-all duration-200 hover:border-black hover:bg-black hover:text-white hover:shadow-md active:scale-95'
        >
          <ArrowLeft size={16} /> Trở về
        </button>
      </div>
      <div className='mx-auto grid max-w-[1360px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8'>
        <section>
          <div className='relative overflow-hidden bg-zinc-100'>
            <img src={images[Math.min(imageIndex, images.length - 1)]} alt={product.name} className='aspect-[4/5] w-full object-cover' />
            {images.length > 1 && (
              <>
                <button type='button' onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} className='absolute left-4 top-1/2 grid h-10 w-10 place-items-center bg-white/90 shadow transition-all duration-200 hover:bg-black hover:text-white active:scale-95'><ChevronLeft /></button>
                <button type='button' onClick={() => setImageIndex((imageIndex + 1) % images.length)} className='absolute right-4 top-1/2 grid h-10 w-10 place-items-center bg-white/90 shadow transition-all duration-200 hover:bg-black hover:text-white active:scale-95'><ChevronRight /></button>
              </>
            )}
          </div>
        </section>
        <section className='space-y-8 lg:sticky lg:top-8 lg:self-start'>
          <div>
            <p className='mb-2 text-xs font-bold uppercase tracking-[.2em] text-zinc-500'>{product.brand}</p>
            <div className='flex items-start justify-between gap-4'>
              <h1 className='text-4xl font-black uppercase leading-tight'>{product.name}</h1>
              <FavoriteButton product={product} />
            </div>
            <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4'>
              <div className='flex items-center gap-3 text-2xl font-bold'>
                <span>{price.toLocaleString('vi-VN')} đ</span>
                {variant?.sale_price != null && variant?.base_price != null && <span className='text-base text-zinc-400 line-through'>{variant.base_price.toLocaleString('vi-VN')} đ</span>}
              </div>

              {/* Tồn kho tương ứng với biến thể đã chọn */}
              {variant ? (
                variant.stock > 5 ? (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 shadow-sm'>
                    <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                    Tồn kho: {variant.stock} sản phẩm
                  </span>
                ) : variant.stock > 0 ? (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700 shadow-sm'>
                    <span className='h-2 w-2 rounded-full bg-amber-500 animate-pulse' />
                    Chỉ còn {variant.stock} sản phẩm!
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-bold text-red-700 shadow-sm'>
                    <span className='h-2 w-2 rounded-full bg-red-500' />
                    Hết hàng
                  </span>
                )
              ) : (
                <span className='inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-1 text-xs font-medium text-zinc-600'>
                  Vui lòng chọn màu & kích thước
                </span>
              )}
            </div>

            {/* Mã SKU & Tình trạng tồn kho */}
            {variant && (
              <div className='mt-3 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-medium'>
                <span>Mã SKU: <strong className='font-mono font-bold text-zinc-800'>{variant.sku}</strong></span>
                <span>
                  Tình trạng tồn kho:{' '}
                  <strong className={variant.stock > 0 ? 'font-bold text-emerald-700' : 'font-bold text-red-600'}>
                    {variant.stock > 0 ? `Sẵn hàng (${variant.stock} cái)` : 'Tạm hết hàng'}
                  </strong>
                </span>
              </div>
            )}
          </div>
          {product.description && <p className='leading-7 text-zinc-600'>{product.description}</p>}
          {product.option_axes?.length ? (
            <div className='space-y-5'>
              {product.option_axes.map((axis) => {
                const attributeId = String(axis.attribute_id)
                const options = product.variants.flatMap((item) => item.option_values || [])
                return (
                  <div key={attributeId}>
                    <div className='mb-2 flex justify-between text-xs font-bold uppercase'>
                      <span>{axis.attribute_name}</span>
                      <span className='text-zinc-600'>{options.find((option) => String(option.attribute_id) === attributeId && String(option.value_id) === selected[attributeId])?.value_name || 'Bắt buộc'}</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {axis.value_ids.map((rawId) => {
                        const valueId = String(rawId)
                        const option = options.find((item) => String(item.attribute_id) === attributeId && String(item.value_id) === valueId)
                        const isSelected = selected[attributeId] === valueId
                        const isAvailable = available(attributeId, valueId)
                        return (
                          <button
                            type='button'
                            key={valueId}
                            disabled={!isAvailable}
                            onClick={() => choose(attributeId, valueId)}
                            className={`flex items-center gap-2 border px-4 py-3 text-sm transition-all duration-200 active:scale-95 ${isSelected ? 'border-black bg-black text-white shadow' : 'border-zinc-200 bg-white hover:border-black hover:bg-zinc-50 text-zinc-900'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={!isAvailable ? 'Hết hàng cho lựa chọn này' : undefined}
                          >
                            {option?.color_hex && <span className='h-4 w-4 rounded-full border shadow-inner' style={{ backgroundColor: option.color_hex }} />}
                            {option?.value_name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className='grid gap-2 sm:grid-cols-2'>
              {product.variants.map((item) => (
                <button
                  type='button'
                  key={item.sku}
                  disabled={item.stock < 1}
                  onClick={() => { setSelectedSku(item.sku); setQuantity(1) }}
                  className={`border p-3 text-left transition-all duration-200 active:scale-95 ${selectedSku === item.sku ? 'border-black bg-black text-white shadow' : 'border-zinc-200 bg-white hover:border-black hover:bg-zinc-50'} disabled:opacity-30`}
                >
                  <div className='font-bold'>{item.color} / {item.size}</div>
                  <div className='mt-1 text-xs opacity-80'>{item.stock > 0 ? `Tồn kho: ${item.stock} sản phẩm` : 'Hết hàng'}</div>
                </button>
              ))}
            </div>
          )}
          <div className='space-y-3'>
            {variant && (
              <div className='flex items-center justify-between text-xs font-semibold text-zinc-600'>
                <span>Số lượng mua:</span>
                <span>
                  {variant.stock > 0 ? (
                    <span className='text-zinc-500'>Tồn kho sẵn có: <strong className='text-black font-bold'>{variant.stock}</strong> sản phẩm</span>
                  ) : (
                    <span className='text-red-600 font-bold'>Sản phẩm tạm hết hàng</span>
                  )}
                </span>
              </div>
            )}
            <div className='flex items-center gap-4'>
              <div className='flex h-14 items-center border border-zinc-300 bg-white'>
                <button type='button' disabled={quantity <= 1 || !variant || variant.stock < 1} onClick={() => setQuantity((value) => value - 1)} className='h-full w-12 transition-colors hover:bg-zinc-100 disabled:opacity-30'><Minus className='mx-auto' size={16} /></button>
                <span className='w-10 text-center font-bold'>{quantity}</span>
                <button type='button' disabled={!variant || quantity >= variant.stock || variant.stock < 1} onClick={() => setQuantity((value) => value + 1)} className='h-full w-12 transition-colors hover:bg-zinc-100 disabled:opacity-30'><Plus className='mx-auto' size={16} /></button>
              </div>
              <button
                type='button'
                disabled={isMutating || !variant || variant.stock < 1}
                onClick={add}
                className='flex h-14 flex-1 items-center justify-center gap-2 bg-black px-5 text-sm font-bold uppercase text-white shadow transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ShoppingBag size={18} />
                {isMutating ? 'Đang thêm...' : !variant ? 'Chọn phiên bản' : variant.stock < 1 ? 'Hết hàng' : 'Thêm vào giỏ'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
      <ReviewSection productId={product._id} />
    </main>
  )
}

