const AI_URL = 'http://localhost:8000/ai/v1/embed';
const BACKEND_URL = 'http://localhost:5000/api/products';

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
  const res = await fetch(BACKEND_URL);
  const json = await res.json();
  const products = json.data;
  console.log(`Loaded ${products.length} products from backend API.\n`);

  const testQueries = [
    'áo bóng đá',
    'giày đá bóng',
    'áo nắng',
    'áo tắm',
    'áo sơ mi công sở',
    'váy dạ hội',
    'điện thoại iphone 15 promax',
    'quần short tập gym'
  ];

  for (const q of testQueries) {
    const qVec = await getEmbedding(q);
    const scored = products.map(p => ({
      name: p.name,
      rawCosine: cosineSimilarity(qVec, p.embedding_vector)
    })).sort((a, b) => b.rawCosine - a.rawCosine);

    console.log(`\n==============================================`);
    console.log(`🔍 QUERY: "${q}"`);
    console.log(`Top 5 Raw Cosine Similarities:`);
    scored.slice(0, 5).forEach((s, idx) => {
      console.log(`   ${idx + 1}. [raw: ${s.rawCosine.toFixed(4)}] ${s.name}`);
    });
    console.log(`Bottom 1: [raw: ${scored[scored.length - 1].rawCosine.toFixed(4)}] ${scored[scored.length - 1].name}`);
  }
}

run();
