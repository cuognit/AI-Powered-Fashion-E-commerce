import Product from '../models/product.model.js';
import { getTextEmbedding } from '../services/ai.service.js';

// Tên của Vector Index đã cấu hình trên MongoDB Atlas
const ATLAS_VECTOR_INDEX = process.env.ATLAS_VECTOR_INDEX_NAME || 'vector_index';

// Danh sách từ dừng / từ chức năng / bổ ngữ chung trong ngành thời trang tiếng Việt & tiếng Anh
const VIETNAMESE_STOPWORDS = new Set([
  'áo', 'quần', 'váy', 'đầm', 'đồ', 'bộ', 'set', 'phụ', 'kiện',
  'nam', 'nữ', 'unisex', 'trẻ', 'em', 'người', 'lớn', 'bé',
  'cho', 'của', 'và', 'với', 'các', 'những', 'cái', 'chiếc', 'loại', 'mẫu',
  'đẹp', 'cao', 'cấp', 'chính', 'hãng', 'thời', 'trang', 'hot', 'trend',
  'mới', 'nhất', 'dáng', 'size', 'màu', 'mùa', 'ngày', 'kiểu', 'phong', 'cách', 'chất',
  'mua', 'bán', 'shop', 'store', 'fashion', 'clothes', 'wear', 'item', 'style'
]);

// Phân cấp nhóm trang phục tự nhiên (Universal Garment Hierarchy)
const GARMENT_CLASSES = {
  FOOTWEAR: ['giày', 'dép', 'sandal', 'sandals', 'sneaker', 'sneakers', 'boots', 'guốc', 'shoes', 'footwear'],
  TOP: ['áo', 'top', 'shirt', 't-shirt', 'tee', 'hoodie', 'jacket', 'bomber', 'blazer', 'cardigan', 'sweater', 'bra', 'croptop', 'polo', 'tanktop'],
  BOTTOM: ['quần', 'bottom', 'pant', 'pants', 'jeans', 'short', 'shorts', 'legging', 'jogger', 'trousers', 'kaki'],
  DRESS_SKIRT: ['váy', 'đầm', 'skirt', 'dress', 'maxi', 'midi'],
  SWIMWEAR: ['bơi', 'tắm', 'bikini', 'monokini', 'swimsuit', 'swimwear'],
  SLEEPWEAR: ['ngủ', 'pijama', 'pyjama', 'homewear', 'sleepwear']
};

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra khớp chính xác từ hoặc cụm từ theo Word Boundary (Ranh giới từ chuẩn)
 * Ngăn chặn lỗi false-positive do substring ('kín đáo' khớp 'đá', 'promax' khớp 'prom')
 */
function matchesWordOrPhrase(text, phrase) {
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  if (!normText || !normPhrase) return false;
  const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(normText);
}

/**
 * Tách và phân tích cấu trúc ngữ nghĩa câu truy vấn (Query Decomposition)
 */
function extractQueryComponents(rawQuery) {
  const normalized = normalizeText(rawQuery);
  const rawWords = normalized.split(/\s+/).filter(w => w.length > 0);

  // 1. Trích xuất các cụm 2 từ (Bigrams / Compound Words)
  const compoundPhrases = [];
  for (let i = 0; i < rawWords.length - 1; i++) {
    const bigram = `${rawWords[i]} ${rawWords[i+1]}`;
    if (!VIETNAMESE_STOPWORDS.has(rawWords[i]) || !VIETNAMESE_STOPWORDS.has(rawWords[i+1])) {
      compoundPhrases.push(bigram);
    }
  }

  // 2. Trích xuất các từ đơn đặc trưng (loại bỏ stopwords)
  const coreWords = rawWords.filter(w => !VIETNAMESE_STOPWORDS.has(w) && w.length >= 2);

  // 3. Tập hợp tất cả các đặc trưng cốt lõi (Bao gồm cả cụm từ và từ đơn)
  const allCoreFeatures = [...new Set([...compoundPhrases, ...coreWords])];

  // 4. Nhận diện loại trang phục
  let requestedClass = null;
  for (const [cls, kws] of Object.entries(GARMENT_CLASSES)) {
    if (kws.some(kw => matchesWordOrPhrase(normalized, kw))) {
      requestedClass = cls;
      break;
    }
  }

  return {
    raw: rawQuery,
    normalized,
    rawWords,
    coreWords,
    compoundPhrases,
    allCoreFeatures,
    hasCoreTerms: allCoreFeatures.length > 0,
    requestedClass
  };
}

/**
 * Tính điểm Hybrid thông minh & mở rộng theo phương pháp chuẩn công nghiệp
 * (Dense Vector Normalized Cosine + Lexical Feature Specificity + Coarse Garment Alignment)
 */
function computeScalableHybridScore(product, queryInfo, rawCosineScore) {
  const prodName = normalizeText(product.name);
  const prodDesc = normalizeText(product.description);
  const prodBrand = normalizeText(product.brand);
  const prodCategory = normalizeText(product.category);
  const fullText = `${prodName} ${prodBrand} ${prodCategory} ${prodDesc}`;

  // TH1: Truy vấn có các đặc trưng cụ thể (Ví dụ: "áo bóng đá", "áo chống nắng", "iphone")
  if (queryInfo.hasCoreTerms) {
    let matchedAllCount = 0;
    let nameMatchCount = 0;

    for (const feature of queryInfo.allCoreFeatures) {
      if (matchesWordOrPhrase(fullText, feature)) {
        matchedAllCount++;
        if (matchesWordOrPhrase(prodName, feature)) {
          nameMatchCount++;
        }
      }
    }

    // NGUYÊN TẮC: Nếu truy vấn có cụm từ ghép (ví dụ "bóng đá"), sản phẩm PHẢI khớp cụm từ ghép hoặc có vector cosine siêu cao (>= 0.78)
    if (queryInfo.compoundPhrases.length > 0) {
      const matchedCompound = queryInfo.compoundPhrases.some(cp => matchesWordOrPhrase(fullText, cp));
      if (!matchedCompound && rawCosineScore < 0.78) {
        return 0; // LOẠI BỎ TRIỆT ĐỂ
      }
    } else {
      if (matchedAllCount === 0 && rawCosineScore < 0.78) {
        return 0;
      }
    }

    // Base: Vector Score chuẩn hóa
    let score = Math.max(0, (rawCosineScore - 0.30) / 0.55);

    // Boost Lexical & Phrase Matches
    const matchRatio = matchedAllCount / queryInfo.allCoreFeatures.length;
    score += matchRatio * 0.35;
    score += (nameMatchCount / queryInfo.allCoreFeatures.length) * 0.25;
    if (matchesWordOrPhrase(prodName, queryInfo.normalized)) score += 0.30;

    // Garment class alignment check & conflict penalty
    if (queryInfo.requestedClass === 'FOOTWEAR') {
      const isFootwear = GARMENT_CLASSES.FOOTWEAR.some(kw => matchesWordOrPhrase(prodName, kw));
      if (!isFootwear) score -= 0.60;
    }
    if (queryInfo.requestedClass === 'TOP') {
      const isBottom = GARMENT_CLASSES.BOTTOM.some(kw => matchesWordOrPhrase(prodName, kw)) || matchesWordOrPhrase(prodName, 'chân váy');
      const isTop = GARMENT_CLASSES.TOP.some(kw => matchesWordOrPhrase(prodName, kw));
      if (isBottom && !isTop) score -= 0.40;
    }
    if (queryInfo.requestedClass === 'BOTTOM') {
      const isTop = GARMENT_CLASSES.TOP.some(kw => matchesWordOrPhrase(prodName, kw)) || matchesWordOrPhrase(prodName, 'đầm');
      const isBottom = GARMENT_CLASSES.BOTTOM.some(kw => matchesWordOrPhrase(prodName, kw));
      if (isTop && !isBottom) score -= 0.40;
    }
    if (queryInfo.requestedClass === 'DRESS_SKIRT') {
      const isDress = GARMENT_CLASSES.DRESS_SKIRT.some(kw => matchesWordOrPhrase(prodName, kw));
      if (!isDress && (matchesWordOrPhrase(prodName, 'quần nam') || matchesWordOrPhrase(prodName, 'áo sơ mi'))) {
        score -= 0.40;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  // TH2: Truy vấn chỉ toàn từ chung chung (Ví dụ: "áo", "quần", "thời trang")
  let score = Math.max(0, (rawCosineScore - 0.30) / 0.55);
  for (const word of queryInfo.rawWords) {
    if (matchesWordOrPhrase(prodName, word)) score += 0.25;
  }
  return Math.max(0, Math.min(1, score));
}

/**
 * Tính Cosine Similarity giữa 2 vector số thực
 */
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Tính điểm độ liên quan từ khóa cho chế độ Keyword Fallback
 */
function calculateKeywordRelevanceScore(product, queryInfo) {
  let score = 0;
  const name = normalizeText(product.name);
  const brand = normalizeText(product.brand);
  const desc = normalizeText(product.description);
  const fullText = `${name} ${brand} ${desc}`;

  if (matchesWordOrPhrase(name, queryInfo.normalized)) score += 100;
  else if (matchesWordOrPhrase(desc, queryInfo.normalized)) score += 40;

  // Nếu có cụm từ ghép mà không khớp cụm từ ghép nào thì trả về 0
  if (queryInfo.compoundPhrases.length > 0) {
    const matchedCompound = queryInfo.compoundPhrases.some(cp => matchesWordOrPhrase(fullText, cp));
    if (!matchedCompound) return 0;
  }

  for (const feature of queryInfo.allCoreFeatures) {
    if (matchesWordOrPhrase(name, feature)) score += 30;
    if (matchesWordOrPhrase(brand, feature)) score += 20;
    if (matchesWordOrPhrase(desc, feature)) score += 10;
  }

  return score;
}

/**
 * Thực hiện tìm kiếm từ khóa truyền thống (Keyword/Regex Search) khi AI Worker không khả dụng
 */
const performKeywordFallbackSearch = async ({ query, skip, limit, page }) => {
  const baseFilter = {
    is_deleted: false,
    status: 'available'
  };

  if (!query || !query.trim()) {
    const [products, totalItems] = await Promise.all([
      Product.find(baseFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(baseFilter)
    ]);
    return { products, totalItems };
  }

  const queryInfo = extractQueryComponents(query);
  const orConditions = [
    { name: { $regex: queryInfo.normalized, $options: 'i' } },
    { brand: { $regex: queryInfo.normalized, $options: 'i' } },
    { description: { $regex: queryInfo.normalized, $options: 'i' } }
  ];

  // Chỉ thêm điều kiện OR với các từ đặc trưng (loại bỏ stopwords để không kéo về toàn bộ áo/quần)
  if (queryInfo.compoundPhrases.length > 0) {
    queryInfo.compoundPhrases.forEach(cp => {
      orConditions.push({ name: { $regex: cp, $options: 'i' } });
      orConditions.push({ description: { $regex: cp, $options: 'i' } });
    });
  } else if (queryInfo.coreWords.length > 0) {
    queryInfo.coreWords.forEach(w => {
      orConditions.push({ name: { $regex: w, $options: 'i' } });
      orConditions.push({ description: { $regex: w, $options: 'i' } });
    });
  }

  const searchFilter = {
    ...baseFilter,
    $or: orConditions
  };

  const rawProducts = await Product.find(searchFilter).lean();

  // Chấm điểm và lọc
  const ranked = rawProducts
    .map(p => ({
      ...p,
      score: calculateKeywordRelevanceScore(p, queryInfo)
    }))
    .filter(p => {
      if (queryInfo.hasCoreTerms && p.score === 0) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return {
    products: ranked.slice(skip, skip + limit),
    totalItems: ranked.length
  };
};

/**
 * Controller xử lý Semantic Search thông minh với AI Embeddings và Fallback
 * Endpoint: GET /api/v1/search/semantic?q=...&page=1&limit=12
 */
export const semanticSearchProducts = async (req, res) => {
  try {
    const rawQuery = (req.query.q || req.query.query || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    // Danh sách gợi ý từ khóa xu hướng
    const popularSuggestions = [
      'Áo chống nắng UPF 50+',
      'Đồ bơi bikini đi biển',
      'Áo sơ mi lụa công sở',
      'Set đồ tập gym yoga',
      'Đầm dạ tiệc cao cấp',
      'Áo thun streetwear unisex'
    ];

    // Trường hợp không có từ khóa tìm kiếm -> Trả về danh sách mặc định mới nhất
    if (!rawQuery) {
      const baseFilter = { is_deleted: false, status: 'available' };
      const [products, totalItems] = await Promise.all([
        Product.find(baseFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(baseFilter)
      ]);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách sản phẩm thành công',
        search_mode: null,
        data: products,
        meta: {
          total_items: totalItems,
          current_page: page,
          total_pages: Math.ceil(totalItems / limit) || 1,
          limit,
          query: ''
        }
      });
    }

    const queryInfo = extractQueryComponents(rawQuery);

    // =========================================================================
    // BƯỚC 1: Gọi Python AI Worker để sinh Vector Embeddings cho câu truy vấn
    // =========================================================================
    let queryVector = null;
    try {
      queryVector = await getTextEmbedding(rawQuery);
    } catch (aiWorkerErr) {
      console.warn('[Semantic Search] Python AI Worker không khả dụng, chuyển sang chế độ Keyword Fallback:', aiWorkerErr.message);
    }

    // =========================================================================
    // BƯỚC 2: Thực hiện Vector Search (Atlas $vectorSearch hoặc Vector Cosine)
    // =========================================================================
    if (queryVector && Array.isArray(queryVector) && queryVector.length === 384) {
      // 2.1. Thử nghiệm với MongoDB Atlas $vectorSearch trước
      try {
        const vectorSearchPipeline = [
          {
            $vectorSearch: {
              index: ATLAS_VECTOR_INDEX,
              path: 'embedding_vector',
              queryVector: queryVector,
              numCandidates: 100,
              limit: Math.max(limit * page, 50),
              filter: {
                $and: [
                  { is_deleted: { $eq: false } },
                  { status: { $eq: 'available' } }
                ]
              }
            }
          },
          {
            $project: {
              name: 1,
              category_id: 1,
              brand: 1,
              description: 1,
              base_price: 1,
              sale_price: 1,
              images: 1,
              variants: 1,
              status: 1,
              is_deleted: 1,
              createdAt: 1,
              updatedAt: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ];

        const rawAtlasResults = await Product.aggregate(vectorSearchPipeline);

        if (rawAtlasResults && rawAtlasResults.length > 0) {
          const scored = rawAtlasResults
            .map(product => {
              const rawScore = product.score || 0;
              const hybridScore = computeScalableHybridScore(product, queryInfo, rawScore);
              return {
                ...product,
                score: Math.max(0, Math.min(1, hybridScore))
              };
            })
            .filter(p => p.score > 0.40)
            .sort((a, b) => b.score - a.score);

          const topScore = scored.length > 0 ? scored[0].score : 0;
          let relevantResults = [];
          if (topScore >= 0.40) {
            relevantResults = scored.filter(p => p.score >= 0.45 && p.score >= topScore * 0.65);
          }

          return res.status(200).json({
            success: true,
            message: relevantResults.length > 0
              ? 'Tìm kiếm ngữ nghĩa thông minh bằng AI (Atlas Vector Search) thành công'
              : `Không tìm thấy sản phẩm nào khớp với "${rawQuery}". Bạn có thể tham khảo các gợi ý dưới đây.`,
            search_mode: 'semantic',
            data: relevantResults.slice(skip, skip + limit),
            meta: {
              total_items: relevantResults.length,
              current_page: page,
              total_pages: Math.ceil(relevantResults.length / limit) || 1,
              limit,
              query: rawQuery,
              suggestions: popularSuggestions
            }
          });
        }
      } catch (atlasErr) {
        console.warn('[Semantic Search] Atlas $vectorSearch chưa sẵn sàng, kích hoạt Vector Cosine Engine:', atlasErr.message);
      }

      // 2.2. Vector Cosine Similarity Engine (Tính toán trực tiếp mảng 384 chiều)
      try {
        const activeProducts = await Product.find({
          is_deleted: false,
          status: 'available',
          embedding_vector: { $exists: true, $ne: [] }
        }).lean();

        if (activeProducts.length > 0) {
          const scored = activeProducts
            .map(product => {
              const rawScore = calculateCosineSimilarity(queryVector, product.embedding_vector);
              const hybridScore = computeScalableHybridScore(product, queryInfo, rawScore);
              return {
                ...product,
                score: Math.max(0, Math.min(1, hybridScore))
              };
            })
            .filter(p => p.score > 0.40)
            .sort((a, b) => b.score - a.score);

          const topScore = scored.length > 0 ? scored[0].score : 0;
          let relevantResults = [];
          if (topScore >= 0.40) {
            relevantResults = scored.filter(p => p.score >= 0.45 && p.score >= topScore * 0.65);
          }

          return res.status(200).json({
            success: true,
            message: relevantResults.length > 0 
              ? 'Tìm kiếm ngữ nghĩa thông minh bằng AI (Vector Cosine Match) thành công'
              : `Không tìm thấy sản phẩm nào khớp với "${rawQuery}". Bạn có thể tham khảo các gợi ý dưới đây.`,
            search_mode: 'semantic',
            data: relevantResults.slice(skip, skip + limit),
            meta: {
              total_items: relevantResults.length,
              current_page: page,
              total_pages: Math.ceil(relevantResults.length / limit) || 1,
              limit,
              query: rawQuery,
              suggestions: popularSuggestions
            }
          });
        }
      } catch (cosineErr) {
        console.error('[Semantic Search] Lỗi khi tính Cosine Similarity:', cosineErr);
      }
    }

    // =========================================================================
    // BƯỚC 3: CƠ CHẾ FALLBACK - Tự động tìm kiếm bằng Keyword Ranked Regex
    // =========================================================================
    try {
      const { products, totalItems } = await performKeywordFallbackSearch({
        query: rawQuery,
        skip,
        limit,
        page
      });

      return res.status(200).json({
        success: true,
        message: totalItems > 0 
          ? 'Tìm kiếm sản phẩm theo từ khóa (Chế độ dự phòng Fallback)'
          : `Không tìm thấy sản phẩm nào khớp với "${rawQuery}". Bạn có thể tham khảo các gợi ý dưới đây.`,
        search_mode: 'keyword_fallback',
        data: products,
        meta: {
          total_items: totalItems,
          current_page: page,
          total_pages: Math.ceil(totalItems / limit) || 1,
          limit,
          query: rawQuery,
          suggestions: popularSuggestions
        }
      });
    } catch (fallbackErr) {
      console.error('[Fallback Search Error] Lỗi khi thực hiện Keyword search:', fallbackErr);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tìm kiếm sản phẩm dự phòng',
        error: fallbackErr.message
      });
    }
  } catch (error) {
    console.error('[Semantic Search Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ trong quá trình xử lý tìm kiếm',
      error: error.message
    });
  }
};
