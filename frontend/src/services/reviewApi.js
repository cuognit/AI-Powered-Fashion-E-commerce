import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

const reviewApi = {
    getReviewsByProduct: (productId) => {
        return axios.get(`${BASE_URL}/reviews/${productId}`);
    },

    addReview: (reviewData) => {
        return axios.post(`${BASE_URL}/reviews`, reviewData);
    }
};

export default reviewApi;