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

const VIETNAMESE_STOPWORDS = new Set([
  'áo', 'quần', 'váy', 'đầm', 'đồ', 'bộ', 'set', 'phụ', 'kiện',
  'nam', 'nữ', 'unisex', 'trẻ', 'em', 'người', 'lớn', 'bé',
  'cho', 'của', 'và', 'với', 'các', 'những', 'cái', 'chiếc', 'loại', 'mẫu',
  'đẹp', 'cao', 'cấp', 'chính', 'hãng', 'thời', 'trang', 'hot', 'trend',
  'mới', 'nhất', 'dáng', 'size', 'màu', 'mùa', 'ngày', 'kiểu', 'phong', 'cách', 'chất',
  'mua', 'bán', 'shop', 'store', 'fashion', 'clothes', 'wear', 'item', 'style'
]);

function extractQueryComponents(rawQuery) {
  const normalized = normalizeText(rawQuery);
  const rawWords = normalized.split(/\s+/).filter(w => w.length > 0);

  const compoundPhrases = [];
  for (let i = 0; i < rawWords.length - 1; i++) {
    const bigram = `${rawWords[i]} ${rawWords[i+1]}`;
    if (!VIETNAMESE_STOPWORDS.has(rawWords[i]) || !VIETNAMESE_STOPWORDS.has(rawWords[i+1])) {
      compoundPhrases.push(bigram);
    }
  }

  const coreWords = rawWords.filter(w => !VIETNAMESE_STOPWORDS.has(w) && w.length >= 2);
  const allCoreFeatures = [...new Set([...compoundPhrases, ...coreWords])];
  return { rawWords, compoundPhrases, coreWords, allCoreFeatures };
}

async function debug() {
  const res = await fetch('http://localhost:5000/api/products?limit=100');
  const json = await res.json();
  const products = json.data;

  const p1 = products.find(p => p.name.includes('Varsity'));
  const q1 = extractQueryComponents('áo bóng đá');
  console.log('Query: "áo bóng đá" ->', q1);
  console.log('Product Bomber:', p1.name);
  console.log('Product Bomber Desc:', p1.description);
  for (const f of q1.allCoreFeatures) {
    const fullText = `${p1.name} ${p1.brand} ${p1.category} ${p1.description}`;
    const m = matchesWordOrPhrase(fullText, f);
    console.log(`  feature: "${f}" matches fullText?`, m);
  }

  const p2 = products.find(p => p.name.includes('Quần Short Thể Thao'));
  const q2 = extractQueryComponents('giày đá bóng');
  console.log('\nQuery: "giày đá bóng" ->', q2);
  console.log('Product Short:', p2.name);
  console.log('Product Short Desc:', p2.description);
  for (const f of q2.allCoreFeatures) {
    const fullText = `${p2.name} ${p2.brand} ${p2.category} ${p2.description}`;
    const m = matchesWordOrPhrase(fullText, f);
    console.log(`  feature: "${f}" matches fullText?`, m);
  }
}
debug();
