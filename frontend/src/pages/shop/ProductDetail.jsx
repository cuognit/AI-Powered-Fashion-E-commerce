import React, { useState, useEffect } from 'react';
import reviewApi from '../../services/reviewApi';

// Mock Data: Sản phẩm
const mockProduct = {
  id: '123',
  name: 'One Life Graphic T-shirt',
  rating: 4.5,
  price: 260,
  originalPrice: 300,
  discount: 40,
  description: 'This graphic t-shirt which is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.',
  images: [
    'https://via.placeholder.com/600x800',
    'https://via.placeholder.com/150x150',
    'https://via.placeholder.com/150x150',
    'https://via.placeholder.com/150x150',
  ],
  colors: ['#4F4631', '#314F4A', '#31344F'],
  sizes: ['Small', 'Medium', 'Large', 'X-Large']
};

const ProductDetail = () => {
  // State quản lý danh sách Review
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State quản lý Form thêm Review
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');

  // Tạm gán Product ID (giống postman) và User ID (vì mình chưa làm chức năng Login)
  const productId = '64a1b2c3d4e5f60012345679';
  const currentUserId = '64a1b2c3d4e5f60012345678';

  // Hàm 1: Lấy danh sách Review
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getReviewsByProduct(productId);
      const reviewList = response.data?.data || response.data || response || [];
      setReviews(reviewList);
    } catch (err) {
      console.error("Lỗi khi lấy đánh giá:", err);
      setError('Không thể tải đánh giá sản phẩm lúc này.');
    } finally {
      setLoading(false);
    }
  };

  // Chạy lần đầu khi vào trang
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Hàm 2: Xử lý gửi Review mới
  const handleSubmitReview = async (e) => {
    e.preventDefault(); // Chặn hành vi load lại trang mặc định của Form

    if (!newContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    try {
      const reviewData = {
        userId: currentUserId,
        productId: productId,
        rating: newRating,
        content: newContent
      };

      // Gọi API POST
      await reviewApi.addReview(reviewData);

      // Thành công -> Reset form -> Đóng form
      setNewContent('');
      setNewRating(5);
      setShowForm(false);

      // Tải lại danh sách review để thấy bài vừa đăng
      fetchReviews();

    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi gửi đánh giá!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 mt-8 font-sans">

      {/* KHỐI 1: CHI TIẾT SẢN PHẨM */}
      <div className="flex flex-col lg:flex-row gap-10 mb-16">
        <div className="lg:w-1/2 flex gap-4">
          <div className="flex flex-col gap-4 w-1/4">
            {mockProduct.images.slice(1).map((img, index) => (
              <img key={index} src={img} alt="thumbnail" className="w-full aspect-[3/4] object-cover rounded-xl border-2 border-transparent hover:border-black cursor-pointer" />
            ))}
          </div>
          <div className="w-3/4">
            <img src={mockProduct.images[0]} alt={mockProduct.name} className="w-full aspect-[3/4] object-cover rounded-xl" />
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold mb-2 uppercase tracking-wide">{mockProduct.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400 text-xl">★★★★★</span>
            <span className="text-gray-500">{mockProduct.rating}/5</span>
            <span className="text-gray-400 text-sm underline cursor-pointer hover:text-black">({reviews.length} Reviews)</span>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold">${mockProduct.price}</span>
            <span className="text-3xl text-gray-400 line-through font-bold">${mockProduct.originalPrice}</span>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">-{mockProduct.discount}%</span>
          </div>
          <p className="text-gray-500 mb-8 leading-relaxed">{mockProduct.description}</p>
          <hr className="mb-6 border-gray-200" />
          <div className="mb-6">
            <p className="text-gray-500 mb-3">Select Colors</p>
            <div className="flex gap-3">
              {mockProduct.colors.map((color, index) => (
                <button key={index} className="w-10 h-10 rounded-full border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-black" style={{ backgroundColor: color }}></button>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <p className="text-gray-500 mb-3">Choose Size</p>
            <div className="flex gap-3 flex-wrap">
              {mockProduct.sizes.map((size, index) => (
                <button key={index} className="px-6 py-3 rounded-full bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition">{size}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-3">
              <button className="text-2xl font-medium px-2">-</button>
              <span className="px-6 font-semibold">1</span>
              <button className="text-2xl font-medium px-2">+</button>
            </div>
            <button className="flex-1 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition">Add to Cart</button>
          </div>
        </div>
      </div>

      {/* KHỐI 2: KHU VỰC REVIEW */}
      <div className="mt-16">

        <div className="flex justify-around border-b border-gray-200 mb-8 pb-4">
          <button className="text-xl text-gray-500 font-medium hover:text-black">Product Details</button>
          <button className="text-xl text-black font-medium border-b-2 border-black px-4">Rating & Reviews</button>
          <button className="text-xl text-gray-500 font-medium hover:text-black">FAQs</button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            All Reviews <span className="text-sm text-gray-500 font-normal">({reviews.length})</span>
          </h2>
          <div className="flex gap-3">
            <button className="bg-gray-100 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition">Latest ▼</button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
            >
              {showForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>
        </div>

        {/* FORM NHẬP REVIEW HIỂN THỊ KHI BẤM NÚT */}
        {showForm && (
          <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold mb-4">Viết đánh giá của bạn</h3>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Số sao:</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value={5}>5 Sao (Tuyệt vời)</option>
                <option value={4}>4 Sao (Tốt)</option>
                <option value={3}>3 Sao (Bình thường)</option>
                <option value={2}>2 Sao (Tệ)</option>
                <option value={1}>1 Sao (Rất tệ)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Nội dung đánh giá:</label>
              <textarea
                rows="4"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              ></textarea>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition">
                Gửi đánh giá
              </button>
            </div>
          </form>
        )}

        {/* DANH SÁCH REVIEW */}
        {loading ? (
          <div className="text-center text-gray-500 py-10">Đang tải đánh giá...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review._id} className="border border-gray-200 rounded-[20px] p-6 hover:shadow-md transition">
                <div className="text-yellow-400 text-lg mb-3">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-lg">{review.userId?.name || "Khách hàng ẩn danh"}</span>
                  <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">"{review.content}"</p>
                <p className="text-gray-400 text-sm font-medium">
                  Đăng ngày {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;