import axios from 'axios'; // Chú ý: Dùng axios gốc của thư viện, không dùng axiosClient nữa

// Nhớ lại lúc em test Postman thành công, em đã dùng link có chữ /api hay không có?
// Ở đây anh đang giả định là CÓ chữ /api. Nếu Postman nãy em test KHÔNG CÓ thì em xóa chữ /api đi nhé!
const BASE_URL = 'http://localhost:3001/api';

const reviewApi = {
    // 1. Gọi GET
    getReviewsByProduct: (productId) => {
        // Gắn cứng URL tuyệt đối, không cho nó chạy nối đuôi bậy bạ nữa
        return axios.get(`${BASE_URL}/reviews/${productId}`);
    },

    // 2. Gọi POST
    addReview: (reviewData) => {
        return axios.post(`${BASE_URL}/reviews`, reviewData);
    }
};

export default reviewApi;