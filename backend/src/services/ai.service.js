import axios from 'axios';

// URL của Python AI Worker (có thể cấu hình qua biến môi trường AI_WORKER_URL)
const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://localhost:8000/ai/v1/embed';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 5000;

/**
 * Gọi sang Python FastAPI AI Worker để sinh Vector Embedding 384 chiều từ text.
 * @param {string} text - Đoạn văn bản (từ khóa tìm kiếm hoặc thông tin sản phẩm)
 * @returns {Promise<number[]|null>} - Mảng vector 384 số float, hoặc null nếu lỗi/timeout
 */
export const getTextEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const cleanText = text.trim();

  try {
    const response = await axios.post(
      AI_WORKER_URL,
      { text: cleanText },
      {
        timeout: AI_TIMEOUT_MS, // Bắt buộc timeout 5s theo Business Rule
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Kiểm tra cấu trúc phản hồi từ FastAPI
    if (response.data && response.data.success && Array.isArray(response.data.embedding)) {
      return response.data.embedding;
    }

    console.warn('[AI Service] Phản hồi không đúng định dạng:', response.data);
    return null;
  } catch (error) {
    // Xử lý các trường hợp lỗi: Timeout (5s), Server Python chết (ECONNREFUSED), v.v.
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn(`[AI Service Fallback Trigger] AI Worker timeout sau ${AI_TIMEOUT_MS}ms. Chuyển sang fallback.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.warn(`[AI Service Fallback Trigger] Không thể kết nối tới AI Worker (${AI_WORKER_URL}). Chuyển sang fallback.`);
    } else {
      console.warn(`[AI Service Fallback Trigger] Lỗi khi gọi AI Worker: ${error.response?.data?.detail || error.message}`);
    }

    // Trả về null để tầng controller nhận biết và kích hoạt cơ chế Fallback tự động
    return null;
  }
};

/**
 * Helper hỗ trợ tổng hợp thông tin sản phẩm thành một chuỗi văn bản phong phú
 * phục vụ cho việc sinh Vector Embedding chất lượng cao khi tạo/cập nhật sản phẩm.
 * @param {Object} product - Đối tượng sản phẩm
 * @returns {string} - Chuỗi văn bản đại diện
 */
export const buildProductEmbeddingText = (product) => {
  const parts = [];
  if (product.name) parts.push(`Tên: ${product.name}`);
  if (product.brand) parts.push(`Thương hiệu: ${product.brand}`);
  if (product.description) parts.push(`Mô tả: ${product.description}`);
  
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];
    if (colors.length) parts.push(`Màu sắc: ${colors.join(', ')}`);
    if (sizes.length) parts.push(`Kích thước: ${sizes.join(', ')}`);
  }

  return parts.join('. ');
};

export default {
  getTextEmbedding,
  buildProductEmbeddingText
};
