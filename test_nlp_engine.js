const AI_URL = 'http://localhost:8000/ai/v1/embed';
const BACKEND_URL = 'http://localhost:5000/api/products';

// Từ dừng tiếng Việt
const VIETNAMESE_STOPWORDS = new Set([
  'áo', 'quần', 'váy', 'đầm', 'đồ', 'bộ', 'set', 'phụ', 'kiện',
  'nam', 'nữ', 'unisex', 'trẻ', 'em', 'người', 'lớn', 'bé',
  'cho', 'của', 'và', 'với', 'các', 'những', 'cái', 'chiếc', 'loại', 'mẫu',
  'đẹp', 'cao', 'cấp', 'chính', 'hãng', 'thời', 'trang', 'hot', 'trend',
  'mới', 'nhất', 'dáng', 'size', 'màu', 'mùa', 'ngày', 'kiểu', 'phong', 'cách', 'chất',
  'mua', 'bán', 'shop', 'store', 'fashion', 'clothes', 'wear', 'item', 'style'
]);

// Garment Class Mapping
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

function matchesWordOrPhrase(text, phrase) {
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  if (!normText || !normPhrase) return false;
  const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(normText);
}

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

  // 2. Trích xuất các từ đơn đặc trưng
  const coreWords = rawWords.filter(w => !VIETNAMESE_STOPWORDS.has(w) && w.length >= 2);

  // 3. Nếu có compound phrases (ví dụ: "bóng đá", "chống nắng"), compound phrases mang trọng số quyết định
  const primaryFeatures = compoundPhrases.length > 0 ? compoundPhrases : coreWords;
  const allCoreFeatures = [...new Set([...compoundPhrases, ...coreWords])];

  // 4. Nhận diện nhóm trang phục
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
    primaryFeatures,
    allCoreFeatures,
    hasCoreTerms: allCoreFeatures.length > 0,
    requestedClass
  };
}

function computeScalableHybridScore(product, queryInfo, rawCosineScore) {
  const prodName = normalizeText(product.name);
  const prodDesc = normalizeText(product.description);
  const prodBrand = normalizeText(product.brand);
  const prodCategory = normalizeText(product.category);
  const fullText = `${prodName} ${prodBrand} ${prodCategory} ${prodDesc}`;

  // TH1: Truy vấn có đặc trưng cụ thể
  if (queryInfo.hasCoreTerms) {
    // Kiểm tra khớp primary features (cụm từ ghép chính)
    let matchedPrimaryCount = 0;
    for (const feat of queryInfo.primaryFeatures) {
      if (matchesWordOrPhrase(fullText, feat)) {
        matchedPrimaryCount++;
      }
    }

    let matchedAllCount = 0;
    let nameMatchCount = 0;
    for (const feat of queryInfo.allCoreFeatures) {
      if (matchesWordOrPhrase(fullText, feat)) {
        matchedAllCount++;
        if (matchesWordOrPhrase(prodName, feat)) {
          nameMatchCount++;
        }
      }
    }

    // NGUYÊN TẮC: Nếu truy vấn có cụm từ ghép (ví dụ "bóng đá", "áo bóng"), 
    // sản phẩm PHẢI khớp cụm từ ghép hoặc có vector cosine siêu cao (>= 0.78)
    if (queryInfo.compoundPhrases.length > 0) {
      const matchedCompound = queryInfo.compoundPhrases.some(cp => matchesWordOrPhrase(fullText, cp));
      if (!matchedCompound && rawCosineScore < 0.78) {
        return 0; // LOẠI BỎ TRIỆT ĐỂ (Ví dụ: "áo bóng đá" không thể khớp "áo khoác bóng chày" hay "áo khoác phối da")
      }
    } else {
      if (matchedAllCount === 0 && rawCosineScore < 0.78) {
        return 0;
      }
    }

    // Base score: Vector chuẩn hóa
    let score = Math.max(0, (rawCosineScore - 0.30) / 0.55);

    // Boost Lexical & Phrase Matches
    const matchRatio = matchedAllCount / queryInfo.allCoreFeatures.length;
    score += matchRatio * 0.35;
    score += (nameMatchCount / queryInfo.allCoreFeatures.length) * 0.25;
    if (matchesWordOrPhrase(prodName, queryInfo.normalized)) score += 0.30;

    // Garment Class Enforcement & Conflict Penalty
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
      if (!isDress && (matchesWordOrPhrase(prodName, 'quần') || matchesWordOrPhrase(prodName, 'áo sơ mi'))) {
        score -= 0.40;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  // TH2: Truy vấn chỉ toàn từ chung chung
  let score = Math.max(0, (rawCosineScore - 0.30) / 0.55);
  for (const word of queryInfo.rawWords) {
    if (matchesWordOrPhrase(prodName, word)) score += 0.25;
  }
  return Math.max(0, Math.min(1, score));
}

async function getEmbedding(text) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  return data.embedding;
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  const res = await fetch('http://localhost:5000/api/products?limit=100');
  const json = await res.json();
  const products = json.data;

  const testQueries = [
    { q: 'áo bóng đá', expected: '0 items' },
    { q: 'giày đá bóng', expected: '0 items' },
    { q: 'điện thoại iphone 15 promax', expected: '0 items' },
    { q: 'áo nắng', expected: 'Áo Khoác Chống Nắng' },
    { q: 'áo chống nắng uv', expected: 'Áo Khoác Chống Nắng' },
    { q: 'áo tắm', expected: 'Đồ Bơi / Áo Tắm / Bikini' },
    { q: 'đồ tập gym yoga', expected: 'Set Đồ Tập Gym Yoga' },
    { q: 'đồ ngủ pijama', expected: 'Bộ Pijama Lụa / Váy Ngủ' },
    { q: 'áo sơ mi công sở', expected: 'Áo Sơ Mi' },
    { q: 'đầm dạ tiệc quyến rũ', expected: 'Đầm Lụa Maxi / Blazer Tweed' },
    { q: 'áo ấm mùa đông', expected: 'Áo Khoác Phao / Áo Len' },
    { q: 'áo thun form rộng oversize', expected: 'Áo Thun Streetwear' }
  ];

  for (const { q, expected } of testQueries) {
    const qVec = await getEmbedding(q);
    const queryInfo = extractQueryComponents(q);

    const scored = products
      .map(p => {
        const rawCos = cosineSimilarity(qVec, p.embedding_vector);
        const hybridScore = computeScalableHybridScore(p, queryInfo, rawCos);
        return {
          name: p.name,
          brand: p.brand,
          rawCosine: rawCos,
          score: hybridScore
        };
      })
      .filter(p => p.score > 0.40)
      .sort((a, b) => b.score - a.score);

    console.log(`\n======================================================`);
    console.log(`🔍 QUERY: "${q}" | Expected: ${expected}`);
    console.log(`   Compound: [${queryInfo.compoundPhrases.join(', ')}] | Class: ${queryInfo.requestedClass}`);
    console.log(`   Found: ${scored.length} items`);
    scored.slice(0, 3).forEach((s, idx) => {
      console.log(`      ${idx + 1}. [Score: ${(s.score * 100).toFixed(1)}% | raw: ${s.rawCosine.toFixed(3)}] [${s.brand}] ${s.name}`);
    });
  }
}

run();
