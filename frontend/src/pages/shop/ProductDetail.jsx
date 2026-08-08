import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import reviewApi from '../../services/reviewApi';
import {
  Sparkles,
  Settings2,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const mockProduct = {
  id: '123',
  name: 'One Life Graphic T-shirt',
  rating: 4.5,
  price: 260,
  originalPrice: 300,
  discount: 40,
  description: 'This graphic t-shirt which is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.',
  images: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  ],
  colors: ['#4F4631', '#314F4A', '#31344F'],
  sizes: ['Small', 'Medium', 'Large', 'X-Large']
};

const ProductDetail = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(3);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      rating: 5,
      content: '',
    },
  });

  const productId = '64a1b2c3d4e5f60012345679';
  const currentUserId = '64a1b2c3d4e5f60012345678';

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getReviewsByProduct(productId);
      const reviewList = response.data?.data || response.data || response || [];
      setReviews(reviewList);
      setVisibleReviews(3);
    } catch (err) {
      console.error("Lỗi khi lấy đánh giá:", err);
      setError('Không thể tải đánh giá sản phẩm lúc này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const handleSubmitReview = async (data) => {
    try {
      const reviewData = {
        userId: currentUserId,
        productId: productId,
        rating: Number(data.rating),
        content: data.content.trim(),
      };

      await reviewApi.addReview(reviewData);

      toast.success('Đánh giá của bạn đã được gửi thành công!');

      reset();
      setShowForm(false);

      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi gửi đánh giá!');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f4] text-black font-sans">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 py-8">

        {/* HERO PRODUCT SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-10 xl:gap-14 items-start">

          {/* LEFT: GALLERY */}
          <div className="space-y-5">
            <div className="relative overflow-hidden bg-[#f3f3f1] rounded-sm">
              <div className="absolute left-4 top-4 z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-800">
                  <Sparkles className="w-[14px] h-[14px]" />
                  HI-RES FABRIC SCAN
                </span>
              </div>

              <img
                src={mockProduct.images[0]}
                alt={mockProduct.name}
                className="w-full aspect-[4/5] object-cover"
              />
            </div>

            {/* THUMBNAILS */}
            <div className="grid grid-cols-2 gap-4">
              {mockProduct.images.slice(1, 3).map((img, index) => (
                <div key={index} className="overflow-hidden bg-white rounded-sm border border-zinc-200">
                  <img
                    src={img}
                    alt={`thumbnail-${index}`}
                    className="w-full aspect-[4/5] object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-8">

            {/* TITLE + PRICE */}
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-[0.04em] leading-[0.95]">
                ONYX HEAVYWEIGHT
                <br />
                HOODIE
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-zinc-900">
                  ${mockProduct.price}
                </span>

                <span className="text-xl text-zinc-400 line-through">
                  ${mockProduct.originalPrice}
                </span>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  -{mockProduct.discount}%
                </span>
              </div>
            </div>

            {/* AI INTEGRATION CARD */}
            <div className="border border-cyan-200 bg-cyan-50 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    AESTHETIX AI INTEGRATION
                  </p>

                  <h3 className="text-2xl font-semibold mt-2">
                    Personalized Fit Engine
                  </h3>
                </div>

                <Settings2 className="w-[18px] h-[18px] text-zinc-700" />
              </div>

              <p className="text-sm leading-6 text-zinc-600">
                Our AI predicts this will be a "Perfect Oversized Fit"
                based on your previous purchase history.
              </p>

              <button className="h-12 w-full bg-cyan-200 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-900 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2">
                <Sparkles className="w-[18px] h-[18px]" />
                Virtual Try-On
              </button>
            </div>

            {/* COLOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Color / Onyx
                </p>

                <span className="text-xs text-zinc-500">3 colors</span>
              </div>

              <div className="flex items-center gap-3">
                {mockProduct.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`h-8 w-8 rounded-full border transition-all ${index === 0
                      ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-[#f7f6f4]'
                      : 'border-zinc-300 hover:border-zinc-500'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* SIZE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Size Selection
                </p>

                <button className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-black">
                  Size Guide
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['XS', 'S', 'M', 'L'].map((size) => (
                  <button
                    key={size}
                    className={`h-12 border text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${size === 'M'
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-black'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3">
              <button className="h-14 flex-1 bg-black text-white uppercase tracking-[0.18em] text-sm font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                Add to Cart
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>

              <button className="h-14 w-14 border border-zinc-300 bg-white flex items-center justify-center hover:border-black transition-colors">
                <Heart className="w-[18px] h-[18px] text-zinc-700" />
              </button>
            </div>

            {/* AI REVIEW INSIGHTS */}
            <div className="border-t border-zinc-200 pt-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold uppercase tracking-[0.16em]">
                  AI Review Insights
                </h2>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-green-600">
                    92% Positive
                  </span>

                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-green-100">
                    <div className="h-full w-[92%] rounded-full bg-green-500" />
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-cyan-300 bg-zinc-50 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-[16px] h-[16px] text-cyan-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                    Synthesized Summary
                  </p>
                </div>

                <p className="text-sm leading-7 text-zinc-700">
                  Customers overwhelmingly praise the structural integrity of the hood
                  and the ultra-soft inner lining. The fit is intentionally generous,
                  and minimal pilling has been reported after extended washing cycles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS*/}
        <section className="mt-20 border-t border-zinc-200 pt-14">

          {/* HEADER */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-900">
                Customer Reviews
              </h2>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-[16px] h-[16px] ${index < Math.round(averageRating)
                        ? 'fill-black text-black'
                        : 'text-zinc-300'
                        }`}
                    />
                  ))}
                </div>

                <span className="text-sm text-zinc-700">
                  <span className="font-semibold text-zinc-900">
                    {averageRating.toFixed(1)}
                  </span>
                  &nbsp;/ 5.0 ({reviews.length} Reviews)
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="h-12 bg-black px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition-colors self-start"
            >
              {showForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* FORM */}
          {showForm && (
            <form onSubmit={handleSubmit(handleSubmitReview)}
              className="mt-10 border border-zinc-200 bg-white p-6 space-y-5"
            >
              <h3 className="text-lg font-semibold uppercase tracking-[0.12em]">
                Write Your Review
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Rating
                </label>

                <select
                  {...register('rating', { required: true })}
                  className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                  <option value={2}>2 Stars (Poor)</option>
                  <option value={1}>1 Star (Terrible)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Your Review
                </label>

                <textarea
                  rows="5"
                  {...register('content', {
                    required: 'Vui lòng nhập nội dung đánh giá!',
                    minLength: {
                      value: 5,
                      message: 'Đánh giá phải có ít nhất 5 ký tự!',
                    },
                  })}
                  placeholder="Share your thoughts about this product..."
                  className="w-full border border-zinc-300 bg-white p-4 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />

                {errors.content && (
                  <p className="text-sm text-red-500">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="h-11 bg-black px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-zinc-800 transition-colors"
              >
                Submit Review
              </button>
            </form>
          )}

          {/* REVIEW LIST */}
          {loading ? (
            <div className="py-16 text-center text-zinc-500">
              Loading reviews...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div className="mt-10 divide-y divide-zinc-200">
              {reviews.slice(0, visibleReviews).map((review) => (
                <article key={review._id} className="py-8 first:pt-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-900">
                        {review.userId?.name || 'Khách hàng ẩn danh'}
                      </h4>

                      <div className="mt-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-[16px] h-[16px] ${index < review.rating
                              ? 'fill-black text-black'
                              : 'text-zinc-300'
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-700">
                    {review.content}
                  </p>
                </article>
              ))}

              {reviews.length > visibleReviews && (
                <div className="pt-8 flex justify-center">
                  <button
                    onClick={() =>
                      setVisibleReviews((prev) => prev + 3)
                    }
                    className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-900 underline underline-offset-4 hover:text-zinc-600 transition-colors"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* YOU MIGHT ALSO LIKE */}
        <section className="mt-20 border-t border-zinc-200 pt-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold uppercase tracking-[0.2em]">
              You Might Also Like
            </h2>

            <div className="hidden md:flex items-center gap-2">
              <button className="h-10 w-10 border border-zinc-300 bg-white flex items-center justify-center hover:border-black transition-colors">
                <ChevronLeft className="w-[18px] h-[18px]" />
              </button>

              <button className="h-10 w-10 border border-zinc-300 bg-white flex items-center justify-center hover:border-black transition-colors">
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: 'Tactical Cargo Pant',
                category: 'BOTTOMS',
                price: '$210'
              },
              {
                name: 'Boxy Essential Tee',
                category: 'TOPS',
                price: '$75'
              },
              {
                name: 'Cipher Utility Bag',
                category: 'ACCESSORIES',
                price: '$120'
              },
              {
                name: 'Distressed Denim Shell',
                category: 'OUTERWEAR',
                price: '$290'
              }
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="overflow-hidden bg-white border border-zinc-200">
                  <img
                    src="https://placehold.co/400x500"
                    alt={item.name}
                    className="w-full aspect-[4/5] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {item.category}
                  </p>

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900 leading-5">
                      {item.name}
                    </h3>

                    <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                      {item.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;