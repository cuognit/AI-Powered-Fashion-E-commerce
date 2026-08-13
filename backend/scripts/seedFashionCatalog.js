import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Category from '../src/models/Category.js'
import Product from '../src/models/product.model.js'

// Ảnh chụp thời trang từ Unsplash. Bộ seed chỉ lưu URL, không tạo tài nguyên Cloudinary.
// Nguồn: https://unsplash.com/collections/3654489/fashion
const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=82`

const imagePools = {
  tshirt: ['photo-1521572267360-ee0c2909d518', 'photo-1581655353564-df123a1eb820', 'photo-1503342217505-b0a15ec3261c'],
  shirt: ['photo-1598033129183-c4f50c736f10', 'photo-1602810318383-e386cc2a3ccf', 'photo-1551488831-00ddcb6c6bd3'],
  polo: ['photo-1581655353564-df123a1eb820', 'photo-1618354691373-d851c5c3a990', 'photo-1521572163474-6864f9cf17ab'],
  knit: ['photo-1576566588028-4147f3842f27', 'photo-1434389677669-e08b4cac3105', 'photo-1608234807905-4466023792f5'],
  hoodie: ['photo-1556821840-3a63f95609a7', 'photo-1620799140408-edc6dcb6d633', 'photo-1578681994506-b8f463449011'],
  coat: ['photo-1539533018447-63fcce2678e3', 'photo-1548126032-079a0fb0099d', 'photo-1551028719-00167b16eac5'],
  blazer: ['photo-1591047139829-d91aecb6caea', 'photo-1507679799987-c73779587ccf', 'photo-1555069519-127aadedf1ee'],
  jeans: ['photo-1542272604-787c3835535d', 'photo-1541099649105-f69ad21f3246', 'photo-1604176354204-9268737828e4'],
  pants: ['photo-1624378439575-d8705ad7ae80', 'photo-1473966968600-fa801b869a1a', 'photo-1509631179647-0177331693ae'],
  shorts: ['photo-1591195853828-11db59a44f6b', 'photo-1565084888279-aca607ecce0c', 'photo-1617952236317-0bd127407984'],
  dress: ['photo-1566174053879-31528523f8ae', 'photo-1572804013309-59a88b7e92f1', 'photo-1595777457583-95e059d581b8'],
  skirt: ['photo-1583496661160-fb5886a0aaaa', 'photo-1582142407894-ec85a1260a46', 'photo-1551028719-00167b16eac5'],
  set: ['photo-1483985988355-763728e1935b', 'photo-1469334031218-e382a71b716b', 'photo-1509631179647-0177331693ae'],
  sport: ['photo-1518611012118-696072aa579a', 'photo-1538805060514-97d9cc17730c', 'photo-1517836357463-d25dfeac3438'],
  swim: ['photo-1582639510494-c80b5de9f148', 'photo-1576426863848-c21f53c60b19', 'photo-1560089000-7433a4ebbd64'],
  sleep: ['photo-1578632767115-351597cf2477', 'photo-1596755389378-c31d21fd1273', 'photo-1595777457583-95e059d581b8'],
  kids: ['photo-1519238263530-99bdd11df2ea', 'photo-1503454537195-1dcabb73ffb9', 'photo-1514090458221-65bb69cf63e6'],
  sneaker: ['photo-1542291026-7eec264c27ff', 'photo-1549298916-b41d501d3772', 'photo-1600269452121-4f2416e55c28'],
  shoes: ['photo-1543163521-1bf539c55dd2', 'photo-1535043934128-cf0b28d52f95', 'photo-1595950653106-6c9ebd614d3a'],
  sandal: ['photo-1603487742131-4160ec999306', 'photo-1562273138-f46be4ebdf33', 'photo-1543163521-1bf539c55dd2'],
  bag: ['photo-1553062407-98eeb64c6a62', 'photo-1584917865442-de89df76afd3', 'photo-1566150905458-1bf1fc113f0d'],
  hat: ['photo-1521369909029-2afed882baee', 'photo-1534215754734-18e55d13e346', 'photo-1575428652377-a2d80e2277fc'],
  glasses: ['photo-1511499767150-a48a237f0083', 'photo-1577803645773-f96470509666', 'photo-1508296695146-257a814070b4'],
  belt: ['photo-1523779917675-b6ed3a42a561', 'photo-1553062407-98eeb64c6a62', 'photo-1523381210434-271e8be1f52b'],
  jewelry: ['photo-1515562141207-7a88fb7ce338', 'photo-1535632066927-ab7c9ab60908', 'photo-1599643478518-a784e5dc4c8f'],
}

const catalog = [
  ['Áo thun', 'ao-thun', 'Áo thun basic, graphic và oversize cho phong cách hằng ngày.', 'TS', 'tshirt', 249000, ['Áo Thun Cotton Compact Basic', 'Áo Thun Oversize Streetwear', 'Áo Thun Graphic Vintage', 'Áo Thun Baby Tee Ôm Dáng']],
  ['Áo sơ mi', 'ao-so-mi', 'Sơ mi công sở, casual và thiết kế thanh lịch.', 'SM', 'shirt', 449000, ['Áo Sơ Mi Trắng Oxford Chống Nhăn', 'Áo Sơ Mi Lụa Cổ V Thanh Lịch', 'Áo Sơ Mi Linen Tay Dài', 'Áo Sơ Mi Kẻ Sọc Form Rộng']],
  ['Áo polo', 'ao-polo', 'Áo polo dệt kim và cotton lịch sự, dễ phối đồ.', 'PL', 'polo', 389000, ['Áo Polo Pique Cotton Classic', 'Áo Polo Dệt Kim Phối Viền', 'Áo Polo Thể Thao Nhanh Khô', 'Áo Polo Oversize Unisex']],
  ['Áo len & Cardigan', 'ao-len-cardigan', 'Áo len, cardigan giữ ấm và phối lớp.', 'LN', 'knit', 529000, ['Áo Len Cổ Lọ Dệt Kim', 'Cardigan Len Cài Nút', 'Áo Len Cổ Tròn Cable Knit', 'Cardigan Croptop Mềm Mịn']],
  ['Hoodie & Sweatshirt', 'hoodie-sweatshirt', 'Trang phục nỉ thoải mái theo phong cách streetwear.', 'HD', 'hoodie', 489000, ['Hoodie Nỉ Bông Unisex', 'Sweatshirt Crewneck Basic', 'Hoodie Zip Form Rộng', 'Sweatshirt In Chữ Collegiate']],
  ['Áo khoác', 'ao-khoac', 'Áo khoác thời trang cho nhiều điều kiện thời tiết.', 'AK', 'coat', 849000, ['Áo Khoác Phao Siêu Nhẹ', 'Áo Khoác Denim Wash Xanh', 'Áo Khoác Dạ Dáng Dài', 'Áo Khoác Chống Nắng UPF 50+']],
  ['Blazer & Vest', 'blazer-vest', 'Blazer và vest dành cho công sở, sự kiện.', 'BZ', 'blazer', 929000, ['Blazer Dạ Tweed Thanh Lịch', 'Blazer Oversize Một Hàng Cúc', 'Vest Gile Công Sở', 'Blazer Linen Dáng Suông']],
  ['Quần jeans', 'quan-jeans', 'Quần denim đa dạng phom dáng và màu wash.', 'JN', 'jeans', 599000, ['Quần Jeans Straight Fit Xanh Đậm', 'Quần Jeans Ống Rộng Cạp Cao', 'Quần Jeans Slim Fit Co Giãn', 'Quần Jeans Baggy Wash Nhạt']],
  ['Quần tây & Kaki', 'quan-tay-kaki', 'Quần dài thanh lịch cho công sở và smart casual.', 'QT', 'pants', 559000, ['Quần Tây Xếp Ly Ống Đứng', 'Quần Kaki Chino Slim Fit', 'Quần Tây Ống Rộng Cạp Cao', 'Quần Kaki Relaxed Fit']],
  ['Quần short', 'quan-short', 'Quần short denim, kaki và thể thao năng động.', 'QS', 'shorts', 329000, ['Quần Short Kaki Basic', 'Quần Short Jeans Cạp Cao', 'Quần Short Thể Thao Hai Lớp', 'Quần Short Linen Mùa Hè']],
  ['Đầm', 'dam', 'Đầm công sở, dạo phố và dự tiệc.', 'DR', 'dress', 799000, ['Đầm Lụa Maxi Dự Tiệc', 'Đầm Hoa Nhí Vintage', 'Đầm Body Midi Cổ Vuông', 'Đầm Sơ Mi Thắt Eo']],
  ['Chân váy', 'chan-vay', 'Chân váy ngắn, midi và công sở dễ phối.', 'SK', 'skirt', 429000, ['Chân Váy Chữ A Xếp Ly', 'Chân Váy Midi Satin', 'Chân Váy Bút Chì Công Sở', 'Chân Váy Jeans Dáng Dài']],
  ['Jumpsuit & Set đồ', 'jumpsuit-set-do', 'Jumpsuit và set phối sẵn tiện dụng.', 'ST', 'set', 749000, ['Jumpsuit Cổ Vest Thắt Eo', 'Set Áo Croptop Quần Ống Rộng', 'Set Blazer Chân Váy', 'Set Linen Áo Sơ Mi Quần Short']],
  ['Đồ thể thao', 'do-the-thao', 'Activewear dành cho gym, yoga và chạy bộ.', 'SP', 'sport', 579000, ['Set Gym Yoga Co Giãn Bốn Chiều', 'Áo Bra Thể Thao Nâng Đỡ', 'Quần Legging Cạp Cao', 'Áo Khoác Chạy Bộ Siêu Nhẹ']],
  ['Đồ bơi', 'do-boi', 'Đồ bơi nữ, nam và trang phục đi biển.', 'SW', 'swim', 469000, ['Bikini Hai Mảnh Cạp Cao', 'Đồ Bơi Một Mảnh Tôn Dáng', 'Quần Bơi Nam Nhanh Khô', 'Áo Choàng Đi Biển Crochet']],
  ['Đồ ngủ & Mặc nhà', 'do-ngu-mac-nha', 'Pajama và trang phục mặc nhà mềm mại.', 'PJ', 'sleep', 399000, ['Bộ Pajama Satin Viền Cổ', 'Váy Ngủ Lụa Phối Ren', 'Bộ Mặc Nhà Cotton Modal', 'Pajama Kẻ Sọc Tay Dài']],
  ['Thời trang trẻ em', 'thoi-trang-tre-em', 'Trang phục thoải mái và an toàn cho trẻ em.', 'KD', 'kids', 319000, ['Set Áo Thun Quần Short Bé', 'Váy Công Chúa Cotton Bé Gái', 'Áo Khoác Bomber Trẻ Em', 'Quần Jogger Nỉ Trẻ Em']],
  ['Giày sneaker', 'giay-sneaker', 'Sneaker lifestyle và thể thao đa dụng.', 'SN', 'sneaker', 1099000, ['Sneaker Retro Phối Màu', 'Sneaker Canvas Cổ Thấp', 'Giày Chạy Bộ Đệm Khí', 'Sneaker Chunky Đế Cao']],
  ['Giày công sở & Cao gót', 'giay-cong-so-cao-got', 'Giày da, loafer và cao gót thanh lịch.', 'SH', 'shoes', 949000, ['Giày Oxford Da Trơn', 'Loafer Da Khóa Kim Loại', 'Giày Cao Gót Mũi Nhọn', 'Giày Mary Jane Gót Vuông']],
  ['Sandal & Dép', 'sandal-dep', 'Sandal và dép thoải mái cho mùa hè.', 'SD', 'sandal', 579000, ['Sandal Quai Mảnh Thanh Lịch', 'Dép Mule Da Tối Giản', 'Sandal Đế Xuồng Có Quai', 'Dép Slides Unisex']],
  ['Túi xách', 'tui-xach', 'Túi xách thời trang cho đi làm và dạo phố.', 'BG', 'bag', 889000, ['Túi Tote Da Công Sở', 'Túi Đeo Chéo Mini', 'Túi Shoulder Dáng Baguette', 'Balo Thời Trang Chống Nước']],
  ['Mũ', 'mu', 'Mũ thời trang hoàn thiện phong cách.', 'HT', 'hat', 289000, ['Mũ Lưỡi Trai Thêu Logo', 'Mũ Bucket Cotton', 'Mũ Len Beanie Basic', 'Mũ Fedora Vành Nhỏ']],
  ['Kính mắt', 'kinh-mat', 'Kính mát và gọng kính thời trang.', 'GL', 'glasses', 499000, ['Kính Mát Gọng Vuông', 'Kính Mắt Mèo Cổ Điển', 'Kính Phi Công Tròng Chống UV', 'Kính Gọng Trong Suốt']],
  ['Thắt lưng', 'that-lung', 'Thắt lưng da và phụ kiện tạo điểm nhấn.', 'BL', 'belt', 379000, ['Thắt Lưng Da Khóa Kim', 'Thắt Lưng Bản Nhỏ Thanh Lịch', 'Thắt Lưng Canvas Unisex', 'Thắt Lưng Bản Rộng Corset']],
  ['Trang sức', 'trang-suc', 'Trang sức tối giản và phụ kiện dự tiệc.', 'JW', 'jewelry', 459000, ['Dây Chuyền Mặt Ngọc Trai', 'Khuyên Tai Vòng Mạ Vàng', 'Vòng Tay Xích Tối Giản', 'Nhẫn Layer Đính Đá']],
]

const brands = ['Aesthetix Studio', 'Urban Mode', 'Maison Lumière', 'North District', 'The Daily Edit']
const colors = ['Đen', 'Trắng', 'Be', 'Xanh navy', 'Nâu']
const apparelSizes = ['S', 'M', 'L']
const shoeSizes = ['37', '38', '39']
const accessorySizes = ['Freesize']

function sizesFor(slug) {
  if (slug.startsWith('giay-') || slug === 'sandal-dep') return shoeSizes
  if (['tui-xach', 'mu', 'kinh-mat', 'that-lung', 'trang-suc'].includes(slug)) return accessorySizes
  return apparelSizes
}

function makeVariants(code, slug, productIndex) {
  return sizesFor(slug).map((size, variantIndex) => ({
    sku: `${code}-${String(productIndex + 1).padStart(2, '0')}-${String(size).replace(/\s/g, '').toUpperCase()}`,
    color: colors[(productIndex + variantIndex) % colors.length],
    size,
    stock: 8 + ((productIndex * 7 + variantIndex * 5) % 28),
  }))
}

try {
  await connectDatabase()

  const categoryDocs = catalog.map(([name, slug, description]) => ({ name, slug, description, is_deleted: false, deletedAt: null }))
  const productDocs = []
  for (let categoryIndex = 0; categoryIndex < catalog.length; categoryIndex += 1) {
    const [categoryName, slug, , code, poolName, basePrice, names] = catalog[categoryIndex]
    for (let productIndex = 0; productIndex < names.length; productIndex += 1) {
      const variants = makeVariants(code, slug, productIndex)
      const price = basePrice + productIndex * 70000 + categoryIndex * 3000
      const salePrice = productIndex % 3 === 0 ? Math.floor(price * 0.88 / 1000) * 1000 : null
      const imageIds = imagePools[poolName]
      const images = [photo(imageIds[productIndex % imageIds.length]), photo(imageIds[(productIndex + 1) % imageIds.length])]
      productDocs.push({
        name: names[productIndex], categorySlug: slug, brand: brands[(categoryIndex + productIndex) % brands.length],
        description: `${names[productIndex]} thuộc danh mục ${categoryName}, thiết kế hiện đại, chất liệu được chọn lọc, dễ phối trong nhiều hoàn cảnh. Sản phẩm có đường may chắc chắn, phom dáng thoải mái và phù hợp phong cách thời trang đương đại.`,
        base_price: price, sale_price: salePrice, images, image_assets: images.map((url) => ({ url, public_id: null })), variants,
        total_stock: variants.reduce((sum, variant) => sum + variant.stock, 0), business_enabled: true, status: 'available', is_deleted: false, deletedAt: null, embedding_vector: [],
      })
    }
  }

  if (categoryDocs.length !== 25 || productDocs.length !== 100) throw new Error('Seed phải tạo đúng 25 danh mục và 100 sản phẩm')

  await Product.deleteMany({})
  await Category.deleteMany({})
  const insertedCategories = await Category.insertMany(categoryDocs)
  const categoryMap = new Map(insertedCategories.map((category) => [category.slug, category._id]))
  await Product.insertMany(productDocs.map(({ categorySlug, ...product }) => ({ ...product, category_id: categoryMap.get(categorySlug) })))

  const [categoryCount, productCount, orphanCount] = await Promise.all([
    Category.countDocuments({ is_deleted: false }), Product.countDocuments({ is_deleted: false }),
    Product.countDocuments({ category_id: { $nin: insertedCategories.map((category) => category._id) } }),
  ])
  console.log(`Seed hoàn tất: ${categoryCount} danh mục, ${productCount} sản phẩm, ${orphanCount} sản phẩm không có danh mục hợp lệ.`)
} finally {
  await mongoose.disconnect()
}
