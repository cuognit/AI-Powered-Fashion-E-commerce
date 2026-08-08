/**
 * Script kiểm tra tự động toàn diện tính năng AI Smart Semantic Search
 * Chạy bằng lệnh: node test_ai.js
 */

const AI_URL = 'http://localhost:8000/ai/v1';
const BACKEND_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM TRA HỆ THỐNG AI SMART SEMANTIC SEARCH');
  console.log('====================================================\n');

  // TEST 1: Kiểm tra Python AI Worker
  console.log('1️⃣  Đang kiểm tra Python AI Worker (cổng 8000)...');
  try {
    const healthRes = await fetch(`${AI_URL}/health`);
    const healthData = await healthRes.json();
    console.log('   ✅ AI Worker đang hoạt động: ', healthData);

    const embedRes = await fetch(`${AI_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Áo sơ mi lụa trắng thanh lịch đi làm' })
    });
    const embedData = await embedRes.json();
    if (embedData.success && embedData.embedding && embedData.embedding.length === 384) {
      console.log(`   ✅ Sinh vector thành công: Mảng ${embedData.dimensions} chiều (384 float numbers)`);
      console.log(`   Sample vector: [${embedData.embedding.slice(0, 5).join(', ')}, ...]`);
    } else {
      console.log('   ❌ Lỗi cấu trúc vector:', embedData);
    }
  } catch (err) {
    console.log('   ⚠️  Không kết nối được tới AI Worker (http://localhost:8000). Hãy đảm bảo bạn đã chạy uvicorn!');
    console.log('      Lỗi:', err.message);
  }

  console.log('\n----------------------------------------------------\n');

  // TEST 2: Kiểm tra Backend Semantic Search & Fallback
  console.log('2️⃣  Đang kiểm tra Backend Express Search API (cổng 5000)...');
  
  // Bước 2.1: Thử nạp dữ liệu mẫu nếu DB đang trống
  try {
    const seedRes = await fetch('http://localhost:5000/api/products/seed', { method: 'POST' });
    const seedData = await seedRes.json();
    if (seedData.success) {
      console.log(`   🌱 Dữ liệu: ${seedData.message}`);
    }
  } catch (seedErr) {
    console.log('   ℹ️  Bỏ qua bước seed dữ liệu:', seedErr.message);
  }

  // Bước 2.2: Test tìm kiếm với bộ 12 câu truy vấn đa dạng phong cách & edge case
  const testQueries = [
    { query: 'áo bóng đá', expected: '(0 sản phẩm - Shop không có đồ bóng đá)', expectZero: true },
    { query: 'giày đá bóng', expected: '(0 sản phẩm - Shop không có giày bóng đá)', expectZero: true },
    { query: 'áo nắng', expected: 'Áo Khoác Chống Nắng', expectZero: false },
    { query: 'áo chống nắng uv', expected: 'Áo Khoác Chống Nắng', expectZero: false },
    { query: 'áo tắm', expected: 'Đồ Bơi / Áo Tắm / Bikini', expectZero: false },
    { query: 'đồ tập gym yoga', expected: 'Set Đồ Tập Gym Yoga', expectZero: false },
    { query: 'đồ ngủ pijama', expected: 'Bộ Pijama Lụa / Váy Ngủ', expectZero: false },
    { query: 'áo sơ mi công sở', expected: 'Áo Sơ Mi Trắng / Quần Tây', expectZero: false },
    { query: 'đầm dạ tiệc quyến rũ', expected: 'Đầm Lụa Maxi / Blazer Tweed', expectZero: false },
    { query: 'áo ấm mùa đông', expected: 'Áo Khoác Phao / Áo Len', expectZero: false },
    { query: 'áo thun form rộng oversize', expected: 'Áo Thun Streetwear', expectZero: false },
    { query: 'điện thoại iphone 15 promax', expected: '(0 sản phẩm - Không tìm thấy)', expectZero: true }
  ];

  let passedTests = 0;

  for (const { query, expected, expectZero } of testQueries) {
    try {
      const searchRes = await fetch(`${BACKEND_URL}/search/semantic?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();
      const count = searchData.data ? searchData.data.length : 0;
      console.log(`\n🔍 TRUY VẤN: "${query}" | Kỳ vọng: ${expected}`);
      console.log(`   👉 Kết quả: [${searchData.search_mode}] - Tìm thấy ${count} sản phẩm:`);
      
      if (count > 0) {
        searchData.data.forEach((item, idx) => {
          const scoreStr = item.score !== undefined ? ` [✨ ${(item.score * 100).toFixed(1)}% MATCH]` : '';
          console.log(`      ${idx + 1}. [${item.brand}] ${item.name}${scoreStr}`);
        });
        if (!expectZero) passedTests++;
      } else {
        console.log(`      ℹ️  Thông điệp: "${searchData.message}"`);
        if (expectZero) passedTests++;
      }
    } catch (err) {
      console.log('   ⚠️  Lỗi khi gọi query:', query, err.message);
    }
  }

  console.log(`\n====================================================`);
  console.log(`🏁 HOÀN TẤT KIỂM TRA: ${passedTests}/${testQueries.length} TEST CASES ĐẠT CHUẨN`);
  console.log(`====================================================`);
}

runTests();
