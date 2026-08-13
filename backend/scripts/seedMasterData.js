import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDatabase } from '../src/config/database.js'
import Brand from '../src/models/Brand.js'
import Category from '../src/models/Category.js'
import Attribute from '../src/models/Attribute.js'
import Product from '../src/models/Product.js'
import User from '../src/models/User.js'
import Order from '../src/models/Order.js'
import Review from '../src/models/review.model.js'
import PaymentTransaction from '../src/models/PaymentTransaction.js'
import Cart from '../src/models/Cart.js'
import WishlistItem from '../src/models/WishlistItem.js'
import RefreshToken from '../src/models/RefreshToken.js'

// Helper utilities
const slugify = (v) =>
  String(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const getRandomSample = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// -------------------------------------------------------------
// 1. DATA DEFINITIONS
// -------------------------------------------------------------

const BRANDS_DATA = [
  { name: 'Nike', slug: 'nike', desc: 'Thương hiệu thể thao hàng đầu thế giới với phong cách hiện đại và hiệu suất đỉnh cao.' },
  { name: 'adidas', slug: 'adidas', desc: 'Biểu tượng thời trang thể thao Đức với thiết kế 3 sọc kinh điển và công nghệ đột phá.' },
  { name: "Levi's", slug: 'levis', desc: 'Thương hiệu trang phục denim kinh điển của Mỹ, nổi tiếng thế giới từ năm 1853.' },
  { name: 'UNIQLO', slug: 'uniqlo', desc: 'Thương hiệu thời trang tối giản LifeWear Nhật Bản với chất lượng cao và sự thoải mái.' },
  { name: 'ZARA', slug: 'zara', desc: 'Thương hiệu thời trang nhanh Tây Ban Nha dẫn đầu xu hướng thời trang quốc tế.' },
  { name: 'H&M', slug: 'hm', desc: 'Thời trang Thụy Điển đa dạng phong cách, thân thiện và phong phú cho mọi lứa tuổi.' },
  { name: 'New Balance', slug: 'new-balance', desc: 'Thương hiệu giày chạy và lifestyle phong cách retro cổ điển đến từ Mỹ.' },
  { name: 'PUMA', slug: 'puma', desc: 'Thời trang thể thao cá tính và năng động với biểu tượng con báo nhảy kiêu hãnh.' },
]

const CATEGORIES_DATA = [
  { name: 'Áo thun', slug: 'ao-thun', desc: 'Bộ sưu tập áo thun nam nữ cotton, phông cơ bản và thể thao thoáng mát.' },
  { name: 'Áo sơ mi', slug: 'ao-so-mi', desc: 'Áo sơ mi công sở, sơ mi đơ mi phong cách thanh lịch và hiện đại.' },
  { name: 'Áo khoác & Blazer', slug: 'ao-khoac-blazer', desc: 'Áo khoác gió, khoác dù, blazer thời trang ấm áp và đẳng cấp.' },
  { name: 'Hoodie & Sweatshirt', slug: 'hoodie-sweatshirt', desc: 'Áo nỉ có mũ và không mũ streetwear trẻ trung, năng động.' },
  { name: 'Quần Jeans', slug: 'quan-jeans', desc: 'Quần bò denim nam nữ dáng ôm, dáng suông, dáng nguyên bản.' },
  { name: 'Quần tây & Kaki', slug: 'quan-tay-kaki', desc: 'Quần kaki, quần âu công sở sang trọng và thoải mái vận động.' },
  { name: 'Đầm & Váy', slug: 'dam-vay', desc: 'Bộ sưu tập đầm nữ, váy midi, váy xòe duyên dáng thời thượng.' },
  { name: 'Giày Sneaker', slug: 'giay-sneaker', desc: 'Giày thể thao, giày phong cách streetwear chính hãng êm ái.' },
  { name: 'Túi xách & Ba lô', slug: 'tui-xach-ba-lo', desc: 'Túi đeo chéo, túi xách nữ, ba lô du lịch và học tập cá tính.' },
  { name: 'Phụ kiện', slug: 'phu-kien', desc: 'Mũ nón, thắt lưng, vớ tất và phụ kiện thời trang hoàn thiện outfit.' },
]

const COLORS_DATA = [
  { name: 'Đen', slug: 'den', color_hex: '#111111' },
  { name: 'Trắng', slug: 'trang', color_hex: '#FFFFFF' },
  { name: 'Xanh Navy', slug: 'xanh-navy', color_hex: '#172B4D' },
  { name: 'Be', slug: 'be', color_hex: '#C9B79C' },
  { name: 'Đỏ', slug: 'do', color_hex: '#A61B1B' },
  { name: 'Xám', slug: 'xam', color_hex: '#808080' },
  { name: 'Vàng Khaki', slug: 'khaki', color_hex: '#C3B091' },
  { name: 'Xanh Lá', slug: 'xanh-la', color_hex: '#2E7D32' },
]

const CATEGORY_SIZES = {
  'ao-thun': ['S', 'M', 'L', 'XL'],
  'ao-so-mi': ['S', 'M', 'L', 'XL'],
  'ao-khoac-blazer': ['S', 'M', 'L', 'XL'],
  'hoodie-sweatshirt': ['S', 'M', 'L', 'XL'],
  'quan-jeans': ['29', '30', '31', '32', '33'],
  'quan-tay-kaki': ['29', '30', '31', '32', '33'],
  'dam-vay': ['S', 'M', 'L', 'XL'],
  'giay-sneaker': ['38', '39', '40', '41', '42', '43'],
  'tui-xach-ba-lo': ['Small', 'Medium', 'Large'],
  'phu-kien': ['Freesize'],
}

// Curated high-resolution fashion images mapped by category & color
const REAL_IMAGE_POOL = {
  'giay-sneaker': {
    den: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&h=1200&q=85',
    trang: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-navy': 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&h=1200&q=85',
    be: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&h=1200&q=85',
    do: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&h=1200&q=85',
    xam: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=900&h=1200&q=85',
    khaki: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-la': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&h=1200&q=85',
  },
  'quan-jeans': {
    den: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&h=1200&q=85',
    trang: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-navy': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&h=1200&q=85',
    be: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=900&h=1200&q=85',
    do: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&h=1200&q=85',
    xam: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=900&h=1200&q=85',
    khaki: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-la': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&h=1200&q=85',
  },
  'ao-thun': {
    den: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&h=1200&q=85',
    trang: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-navy': 'https://images.unsplash.com/photo-1583743814966-8936f37f4f7d?auto=format&fit=crop&w=900&h=1200&q=85',
    be: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&h=1200&q=85',
    do: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&h=1200&q=85',
    xam: 'https://images.unsplash.com/photo-1551488831-00ddcb6cbd3?auto=format&fit=crop&w=900&h=1200&q=85',
    khaki: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-la': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&h=1200&q=85',
  },
  'dam-vay': {
    den: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&h=1200&q=85',
    trang: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-navy': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&h=1200&q=85',
    be: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&h=1200&q=85',
    do: 'https://images.unsplash.com/photo-1585488431767-6d3f7c9b1c43?auto=format&fit=crop&w=900&h=1200&q=85',
    xam: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=900&h=1200&q=85',
    khaki: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-la': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&h=1200&q=85',
  },
  'tui-xach-ba-lo': {
    den: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&h=1200&q=85',
    trang: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-navy': 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&h=1200&q=85',
    be: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&h=1200&q=85',
    do: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&h=1200&q=85',
    xam: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&h=1200&q=85',
    khaki: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&h=1200&q=85',
    'xanh-la': 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=900&h=1200&q=85',
  },
}

// Master list of 105 Real Fashion Product Catalog Items
const MASTER_PRODUCT_TEMPLATES = [
  // 1. Nike Products
  { name: 'Giày Nike Air Force 1 07', brand: 'nike', category: 'giay-sneaker', price: 2990000, code: 'AF1-07' },
  { name: 'Giày Nike Air Max 90', brand: 'nike', category: 'giay-sneaker', price: 3490000, code: 'AM90' },
  { name: 'Giày Nike Dunk Low Retro', brand: 'nike', category: 'giay-sneaker', price: 3190000, code: 'DUNK-LOW' },
  { name: 'Giày Nike Pegasus 40 Running', brand: 'nike', category: 'giay-sneaker', price: 3590000, code: 'PEG40' },
  { name: 'Áo Hoodie Nike Club Fleece', brand: 'nike', category: 'hoodie-sweatshirt', price: 1590000, code: 'NK-HOOD' },
  { name: 'Áo Thun Nike Dri-FIT Fitness', brand: 'nike', category: 'ao-thun', price: 890000, code: 'NK-DRIFIT' },
  { name: 'Áo Khoác Nike Windrunner Jacket', brand: 'nike', category: 'ao-khoac-blazer', price: 2290000, code: 'NK-WIND' },
  { name: 'Quần Jogger Nike Sportswear Club', brand: 'nike', category: 'quan-tay-kaki', price: 1390000, code: 'NK-JOG' },
  { name: 'Ba Lô Nike Heritage Backpack', brand: 'nike', category: 'tui-xach-ba-lo', price: 850000, code: 'NK-BP' },
  { name: 'Mũ Lưỡi Trai Nike Club Cap', brand: 'nike', category: 'phu-kien', price: 550000, code: 'NK-CAP' },
  { name: 'Áo Sơ Mi Nike Sportswear Tech', brand: 'nike', category: 'ao-so-mi', price: 1490000, code: 'NK-SHIRT' },
  { name: 'Quần Shorts Nike Flex Woven', brand: 'nike', category: 'quan-tay-kaki', price: 990000, code: 'NK-SHORT' },
  { name: 'Túi Đeo Chéo Nike Heritage Crossbody', brand: 'nike', category: 'tui-xach-ba-lo', price: 690000, code: 'NK-CROSS' },

  // 2. adidas Products
  { name: 'Giày adidas Samba OG Classic', brand: 'adidas', category: 'giay-sneaker', price: 2790000, code: 'AD-SAMBA' },
  { name: 'Giày adidas Gazelle Bold', brand: 'adidas', category: 'giay-sneaker', price: 2990000, code: 'AD-GAZ' },
  { name: 'Giày adidas Ultraboost Light', brand: 'adidas', category: 'giay-sneaker', price: 4200000, code: 'AD-UB' },
  { name: 'Giày adidas Stan Smith Primegreen', brand: 'adidas', category: 'giay-sneaker', price: 2390000, code: 'AD-STAN' },
  { name: 'Áo Khoác Track Jacket Firebird', brand: 'adidas', category: 'ao-khoac-blazer', price: 1990000, code: 'AD-FIRE' },
  { name: 'Áo Thun adidas 3-Stripes Essentials', brand: 'adidas', category: 'ao-thun', price: 790000, code: 'AD-TEE' },
  { name: 'Áo Hoodie adidas Originals Trefoil', brand: 'adidas', category: 'hoodie-sweatshirt', price: 1690000, code: 'AD-HOOD' },
  { name: 'Quần Track Pants adidas Adicolor', brand: 'adidas', category: 'quan-tay-kaki', price: 1590000, code: 'AD-PANTS' },
  { name: 'Túi Đeo Vai adidas Originals Mini', brand: 'adidas', category: 'tui-xach-ba-lo', price: 750000, code: 'AD-BAG' },
  { name: 'Mũ Bucket adidas Trefoil Cap', brand: 'adidas', category: 'phu-kien', price: 490000, code: 'AD-BUCKET' },
  { name: 'Áo Sơ Mi adidas Resort Short Sleeve', brand: 'adidas', category: 'ao-so-mi', price: 1390000, code: 'AD-SHIRT' },

  // 3. Levi's Products
  { name: "Quần Jeans Levi's 501 Original Fit", brand: 'levis', category: 'quan-jeans', price: 2290000, code: 'LV-501' },
  { name: "Quần Jeans Levi's 511 Slim Fit", brand: 'levis', category: 'quan-jeans', price: 2090000, code: 'LV-511' },
  { name: "Quần Jeans Levi's 505 Regular Fit", brand: 'levis', category: 'quan-jeans', price: 1990000, code: 'LV-505' },
  { name: "Áo Khoác Denim Levi's Trucker Jacket", brand: 'levis', category: 'ao-khoac-blazer', price: 2690000, code: 'LV-TRUCK' },
  { name: "Áo Thun Levi's Housemark Logo Tee", brand: 'levis', category: 'ao-thun', price: 590000, code: 'LV-TEE' },
  { name: "Áo Sơ Mi Denim Levi's Western Shirt", brand: 'levis', category: 'ao-so-mi', price: 1490000, code: 'LV-WEST' },
  { name: "Thắt Lưng Levi's Leather Belt Classic", brand: 'levis', category: 'phu-kien', price: 890000, code: 'LV-BELT' },
  { name: "Áo Hoodie Levi's Graphic Standard", brand: 'levis', category: 'hoodie-sweatshirt', price: 1390000, code: 'LV-HOOD' },
  { name: "Quần Jeans Levi's Ribcage Straight Leg", brand: 'levis', category: 'quan-jeans', price: 2390000, code: 'LV-RIBCAGE' },
  { name: "Váy Denim Levi's Iconic Skirt", brand: 'levis', category: 'dam-vay', price: 1290000, code: 'LV-SKIRT' },
  { name: "Túi Tote Levi's Cotton Canvas", brand: 'levis', category: 'tui-xach-ba-lo', price: 490000, code: 'LV-TOTE' },

  // 4. UNIQLO Products
  { name: 'Áo Thun UNIQLO AIRism Oversized', brand: 'uniqlo', category: 'ao-thun', price: 399000, code: 'UQ-AIRISM' },
  { name: 'Áo Thun UNIQLO Supima Cotton Tee', brand: 'uniqlo', category: 'ao-thun', price: 299000, code: 'UQ-SUPIMA' },
  { name: 'Áo Sơ Mi UNIQLO Oxford Long Sleeve', brand: 'uniqlo', category: 'ao-so-mi', price: 599000, code: 'UQ-OXFORD' },
  { name: 'Áo Sơ Mi Linen UNIQLO Premium', brand: 'uniqlo', category: 'ao-so-mi', price: 799000, code: 'UQ-LINEN' },
  { name: 'Quần Smart Ankle Pants UNIQLO', brand: 'uniqlo', category: 'quan-tay-kaki', price: 799000, code: 'UQ-ANKLE' },
  { name: 'Quần Kaki UNIQLO Vintage Chino', brand: 'uniqlo', category: 'quan-tay-kaki', price: 699000, code: 'UQ-CHINO' },
  { name: 'Áo Phao UNIQLO Ultra Light Down', brand: 'uniqlo', category: 'ao-khoac-blazer', price: 1690000, code: 'UQ-ULD' },
  { name: 'Túi Đeo Bán Nguyệt UNIQLO Round Shoulder', brand: 'uniqlo', category: 'tui-xach-ba-lo', price: 399000, code: 'UQ-BAG' },
  { name: 'Đầm UNIQLO Mercerized Cotton Midi', brand: 'uniqlo', category: 'dam-vay', price: 799000, code: 'UQ-DRESS' },
  { name: 'Áo Sweatshirt UNIQLO Dry-EX', brand: 'uniqlo', category: 'hoodie-sweatshirt', price: 599000, code: 'UQ-SWEAT' },
  { name: 'Quần Jeans UNIQLO Stretch Slim Fit', brand: 'uniqlo', category: 'quan-jeans', price: 999000, code: 'UQ-JEANS' },

  // 5. ZARA Products
  { name: 'Áo Blazer ZARA Tailored Oversized', brand: 'zara', category: 'ao-khoac-blazer', price: 1990000, code: 'ZR-BLAZER' },
  { name: 'Đầm Midi ZARA Satin Slip Dress', brand: 'zara', category: 'dam-vay', price: 1390000, code: 'ZR-SATIN' },
  { name: 'Áo Sơ Mi ZARA Poplin Oversized', brand: 'zara', category: 'ao-so-mi', price: 999000, code: 'ZR-SHIRT' },
  { name: 'Quần Tây ZARA High-Waisted Wide Leg', brand: 'zara', category: 'quan-tay-kaki', price: 1190000, code: 'ZR-PANTS' },
  { name: 'Áo Thun ZARA Essential Ribbed Tee', brand: 'zara', category: 'ao-thun', price: 399000, code: 'ZR-TEE' },
  { name: 'Áo Khoác Da ZARA Faux Leather Jacket', brand: 'zara', category: 'ao-khoac-blazer', price: 2490000, code: 'ZR-LEATHER' },
  { name: 'Túi Xách ZARA Shoulder Bag Gold Chain', brand: 'zara', category: 'tui-xach-ba-lo', price: 1290000, code: 'ZR-BAG' },
  { name: 'Đầm Ngắn ZARA Linen Cut-Out Dress', brand: 'zara', category: 'dam-vay', price: 1190000, code: 'ZR-DRESS' },
  { name: 'Quần Jeans ZARA Straight High Rise', brand: 'zara', category: 'quan-jeans', price: 1290000, code: 'ZR-JEANS' },
  { name: 'Áo Hoodie ZARA Heavyweight Wash', brand: 'zara', category: 'hoodie-sweatshirt', price: 1190000, code: 'ZR-HOOD' },

  // 6. H&M Products
  { name: 'Áo Thun H&M Regular Fit Cotton', brand: 'hm', category: 'ao-thun', price: 249000, code: 'HM-TEE' },
  { name: 'Áo Sơ Mi H&M Linen-Blend Shirt', brand: 'hm', category: 'ao-so-mi', price: 599000, code: 'HM-LINEN' },
  { name: 'Đầm H&M Floral Printed Viscose', brand: 'hm', category: 'dam-vay', price: 699000, code: 'HM-FLORAL' },
  { name: 'Áo Hoodie H&M Relaxed Fit', brand: 'hm', category: 'hoodie-sweatshirt', price: 699000, code: 'HM-HOOD' },
  { name: 'Quần Jogger H&M Sweatpants Cotton', brand: 'hm', category: 'quan-tay-kaki', price: 499000, code: 'HM-JOG' },
  { name: 'Áo Khoác Cardigan H&M Knitwear', brand: 'hm', category: 'ao-khoac-blazer', price: 799000, code: 'HM-CARD' },
  { name: 'Quần Jeans H&M Loose Straight Fit', brand: 'hm', category: 'quan-jeans', price: 899000, code: 'HM-JEANS' },
  { name: 'Túi Crossbody H&M Canvas Mini', brand: 'hm', category: 'tui-xach-ba-lo', price: 349000, code: 'HM-BAG' },
  { name: 'Đầm H&M Ribbed Bodycon Dress', brand: 'hm', category: 'dam-vay', price: 499000, code: 'HM-BODY' },
  { name: 'Mũ Beanie H&M Fine-Knit Hat', brand: 'hm', category: 'phu-kien', price: 199000, code: 'HM-HAT' },

  // 7. New Balance Products
  { name: 'Giày New Balance 574 Core Classic', brand: 'new-balance', category: 'giay-sneaker', price: 2490000, code: 'NB-574' },
  { name: 'Giày New Balance 530 Lifestyle', brand: 'new-balance', category: 'giay-sneaker', price: 2790000, code: 'NB-530' },
  { name: 'Giày New Balance 2002R Protection', brand: 'new-balance', category: 'giay-sneaker', price: 3890000, code: 'NB-2002R' },
  { name: 'Giày New Balance 9060 Unisex', brand: 'new-balance', category: 'giay-sneaker', price: 3990000, code: 'NB-9060' },
  { name: 'Áo Thun New Balance Athletics Tee', brand: 'new-balance', category: 'ao-thun', price: 750000, code: 'NB-TEE' },
  { name: 'Áo Hoodie New Balance Classic Stacked', brand: 'new-balance', category: 'hoodie-sweatshirt', price: 1490000, code: 'NB-HOOD' },
  { name: 'Quần Shorts New Balance Athletics', brand: 'new-balance', category: 'quan-tay-kaki', price: 890000, code: 'NB-SHORT' },
  { name: 'Mũ Lưỡi Trai New Balance Curved Cap', brand: 'new-balance', category: 'phu-kien', price: 450000, code: 'NB-CAP' },
  { name: 'Ba Lô New Balance Team Backpack', brand: 'new-balance', category: 'tui-xach-ba-lo', price: 890000, code: 'NB-BP' },
  { name: 'Áo Khoác Windcheater New Balance', brand: 'new-balance', category: 'ao-khoac-blazer', price: 1890000, code: 'NB-JACKET' },

  // 8. PUMA Products
  { name: 'Giày PUMA Suede Classic XXI', brand: 'puma', category: 'giay-sneaker', price: 1990000, code: 'PM-SUEDE' },
  { name: 'Giày PUMA Palermo OG Leather', brand: 'puma', category: 'giay-sneaker', price: 2390000, code: 'PM-PALERMO' },
  { name: 'Giày PUMA RS-X3 Puzzle', brand: 'puma', category: 'giay-sneaker', price: 2890000, code: 'PM-RSX' },
  { name: 'Áo T7 Track Jacket PUMA Iconic', brand: 'puma', category: 'ao-khoac-blazer', price: 1690000, code: 'PM-T7' },
  { name: 'Áo Thun PUMA Essentials Logo Tee', brand: 'puma', category: 'ao-thun', price: 590000, code: 'PM-TEE' },
  { name: 'Áo Hoodie PUMA Classic Fleece', brand: 'puma', category: 'hoodie-sweatshirt', price: 1390000, code: 'PM-HOOD' },
  { name: 'Ba Lô PUMA Phase Backpack', brand: 'puma', category: 'tui-xach-ba-lo', price: 690000, code: 'PM-BP' },
  { name: 'Mũ PUMA Classic Baseball Cap', brand: 'puma', category: 'phu-kien', price: 390000, code: 'PM-CAP' },
  { name: 'Quần Track Pants PUMA T7', brand: 'puma', category: 'quan-tay-kaki', price: 1390000, code: 'PM-PANTS' },
  { name: 'Túi Đeo Chéo PUMA Portable Bag', brand: 'puma', category: 'tui-xach-ba-lo', price: 490000, code: 'PM-CROSS' },
]

// Add variation suffixes to reach 105 total products cleanly
const PRODUCT_SUFFIXES = [
  'Phiên Bản Đô Thị',
  'Thiết Kế Cổ Điển',
  'Dòng Thể Thao Studio',
  'Phiên Bản Tối Giản',
  'Dòng Thu Đông Essential',
]

// 50 Vietnamese Customers Data
const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ', 'Hoàng', 'Đặng', 'Bùi', 'Ngô', 'Đỗ', 'Hồ', 'Đoàn']
const MIDDLE_NAMES = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Quốc', 'Thanh', 'Anh', 'Kim', 'Đức', 'Gia', 'Bảo', 'Ngọc']
const LAST_NAMES = ['An', 'Bình', 'Cường', 'Dương', 'Hương', 'Hải', 'Khai', 'Linh', 'Long', 'Nam', 'Phương', 'Quân', 'Sơn', 'Tú', 'Thảo', 'Trang', 'Tuấn', 'Vinh', 'Yến']

const CITIES_AND_ADDRESSES = [
  'Số 15 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  'Số 88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  'Số 245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
  'Số 42 Hàng Bài, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
  'Số 120 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
  'Số 75 Nguyễn Văn Linh, Quận Thanh Khê, Đà Nẵng',
  'Số 30 Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
  'Số 18 Trần Phú, Phường Máy Tơ, Quận Ngô Quyền, Hải Phòng',
  'Số 92 Trần Hưng Đạo, Phường Lộc Thọ, TP. Nha Trang',
  'Số 50 Hùng Vương, Phường Phú Nhuận, TP. Huế',
  'Số 104 Lê Hồng Phong, Phường 4, TP. Vũng Tàu',
  'Số 36 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
]

// Vietnamese Reviews templates
const REVIEWS_5_STAR = [
  'Sản phẩm tuyệt vời, chất vải rất đẹp và thoáng mát. Đóng gói vô cùng cẩn thận!',
  'Giày chuẩn chính hãng, đi cực kỳ êm chân và đúng size. Sẽ tiếp tục ủng hộ shop.',
  'Áo đẹp xuất sắc, chuẩn form như mô tả. Giao hàng siêu nhanh chỉ trong 2 ngày.',
  'Đầm lên dáng chuẩn, đường kim mũi chỉ tỉ mỉ. Chất liệu cao cấp rất đáng tiền.',
  'Hàng xịn xịn, đúng màu hình chụp. Rất hài lòng với thái độ phục vụ của shop!',
]

const REVIEWS_4_STAR = [
  'Sản phẩm đẹp đúng mô tả, tuy nhiên shipper giao hàng hơi chậm hơn dự kiến 1 ngày.',
  'Chất lượng tốt trong tầm giá, màu sắc bên ngoài đậm hơn trong ảnh minh họa một chút.',
  'Áo vừa vặn, mặc mát mẻ dễ chịu. Đáng tiền mua nhé mọi người.',
  'Đóng gói chắc chắn, giao đủ số lượng và quà tặng kèm.',
]

const REVIEWS_3_STAR = [
  'Hàng dùng tạm ổn, vải hơi mỏng so với kỳ vọng nhưng form dáng khá ổn.',
  'Giày hơi cứng 1 chút ở phần gót, mang vài lần hy vọng sẽ mềm hơn.',
]

const REVIEWS_LOW_STAR = [
  'Hộp đựng sản phẩm bị móp méo trong quá trình vận chuyển.',
  'Áo bị chật hơn so với bảng quy đổi kích thước tiêu chuẩn, phải làm thủ tục đổi trả.',
]

// -------------------------------------------------------------
// 2. MASTER SEED EXECUTION
// -------------------------------------------------------------

async function seedMasterData() {
  console.log('🚀 Bắt đầu quá trình Master Seed dữ liệu thực tế...')

  try {
    await connectDatabase()
    console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB.')

    // Step A: Wipe out existing collections
    console.log('🧹 Đang dọn dẹp các collection cũ...')
    await Promise.all([
      User.deleteMany({}),
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Attribute.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      PaymentTransaction.deleteMany({}),
      Cart.deleteMany({}),
      WishlistItem.deleteMany({}),
      RefreshToken.deleteMany({}),
    ])
    console.log('✨ Đã xóa sạch dữ liệu cũ.')

    // Step B: Seed Brands & Categories
    console.log('📦 Đang chèn Brands & Categories...')
    const brandDocs = new Map(
      (
        await Brand.insertMany(
          BRANDS_DATA.map((b) => ({
            name: b.name,
            slug: b.slug,
            description: b.desc,
            is_deleted: false,
            deletedAt: null,
          })),
        )
      ).map((b) => [b.slug, b]),
    )

    const categoryDocs = new Map(
      (
        await Category.insertMany(
          CATEGORIES_DATA.map((c) => ({
            name: c.name,
            slug: c.slug,
            description: c.desc,
            is_deleted: false,
            deletedAt: null,
          })),
        )
      ).map((c) => [c.slug, c]),
    )

    // Step C: Seed Attributes (Colors & Sizes)
    console.log('🎨 Đang chèn Attributes (Màu sắc & Kích thước)...')
    const colorAttribute = await Attribute.create({
      name: 'Màu sắc',
      slug: 'mau-sac',
      display_type: 'color',
      values: COLORS_DATA.map((c) => ({
        name: c.name,
        slug: c.slug,
        color_hex: c.color_hex,
        is_deleted: false,
      })),
      is_deleted: false,
    })

    const allSizesSet = new Set(Object.values(CATEGORY_SIZES).flat())
    const sizeAttribute = await Attribute.create({
      name: 'Kích thước',
      slug: 'kich-thuoc',
      display_type: 'text',
      values: Array.from(allSizesSet).map((s) => ({
        name: s,
        slug: slugify(s),
        is_deleted: false,
      })),
      is_deleted: false,
    })

    // Step D: Generate 105 Real Parent Products & ~500+ Variants
    console.log('🛍️ Đang tạo 105 sản phẩm thật và 500+ biến thể SKU...')
    const rawTemplates = []
    let productIndex = 0

    // Repeat template base with suffixes to reach exactly 105 parent products
    for (let i = 0; i < 2; i++) {
      for (const t of MASTER_PRODUCT_TEMPLATES) {
        if (productIndex >= 105) break
        const suffix = i === 0 ? '' : ` (${PRODUCT_SUFFIXES[productIndex % PRODUCT_SUFFIXES.length]})`
        rawTemplates.push({
          ...t,
          name: t.name + suffix,
          code: `${t.code}-${productIndex + 1}`,
        })
        productIndex++
      }
    }

    const productDocsToInsert = []

    for (let i = 0; i < rawTemplates.length; i++) {
      const template = rawTemplates[i]
      const brandObj = brandDocs.get(template.brand)
      const categoryObj = categoryDocs.get(template.category)

      // Pick 2-4 realistic colors for this product
      const selectedColors = getRandomSample(COLORS_DATA, getRandomInt(2, 4))
      const availableSizes = CATEGORY_SIZES[template.category] || ['S', 'M', 'L', 'XL']

      // Build real asset gallery
      const poolForCat = REAL_IMAGE_POOL[template.category] || REAL_IMAGE_POOL['ao-thun']
      const imageAssets = selectedColors.map((color) => {
        const url = poolForCat[color.slug] || poolForCat['den']
        return {
          _id: new mongoose.Types.ObjectId(),
          url,
          public_id: null,
        }
      })

      const colorMapAssetId = new Map()
      selectedColors.forEach((color, idx) => {
        colorMapAssetId.set(color.slug, imageAssets[idx]._id)
      })

      // Generate SKU Variants
      const variants = []
      selectedColors.forEach((color, cIdx) => {
        availableSizes.forEach((size, sIdx) => {
          const colorAttrVal = colorAttribute.values.find((v) => v.slug === color.slug)
          const sizeAttrVal = sizeAttribute.values.find((v) => v.slug === slugify(size))

          const priceDiff = (cIdx + sIdx) * 10000
          const basePrice = template.price + priceDiff
          const hasDiscount = (i + cIdx + sIdx) % 5 === 0
          const salePrice = hasDiscount ? Math.round(basePrice * 0.85) : null

          const sku = `${template.code}-${color.slug.toUpperCase()}-${slugify(size).toUpperCase()}`

          variants.push({
            sku,
            stock: getRandomInt(8, 45),
            base_price: basePrice,
            sale_price: salePrice,
            color: color.name,
            size: size,
            option_values: [
              {
                attribute_id: colorAttribute._id,
                value_id: colorAttrVal._id,
                attribute_name: colorAttribute.name,
                attribute_slug: colorAttribute.slug,
                value_name: colorAttrVal.name,
                value_slug: colorAttrVal.slug,
                color_hex: colorAttrVal.color_hex,
              },
              {
                attribute_id: sizeAttribute._id,
                value_id: sizeAttrVal._id,
                attribute_name: sizeAttribute.name,
                attribute_slug: sizeAttribute.slug,
                value_name: sizeAttrVal.name,
                value_slug: sizeAttrVal.slug,
                color_hex: null,
              },
            ],
            image_asset_ids: [colorMapAssetId.get(color.slug)],
          })
        })
      })

      const hasProductDiscount = i % 4 === 0
      const parentSalePrice = hasProductDiscount ? Math.round(template.price * 0.88) : null

      productDocsToInsert.push({
        name: template.name,
        brand_id: brandObj._id,
        brand: brandObj.name,
        category_id: categoryObj._id,
        description: `Sản phẩm ${template.name} thuộc thương hiệu chính hãng ${brandObj.name}. Chất liệu cao cấp, đường may tinh tế, phù hợp cho nhiều hoàn cảnh sử dụng hàng ngày và thể thao năng động.`,
        base_price: template.price,
        sale_price: parentSalePrice,
        images: imageAssets.map((a) => a.url),
        image_assets: imageAssets,
        gallery_asset_ids: imageAssets.map((a) => a._id),
        option_axes: [
          {
            attribute_id: colorAttribute._id,
            attribute_name: colorAttribute.name,
            attribute_slug: colorAttribute.slug,
            value_ids: selectedColors.map((c) => colorAttribute.values.find((v) => v.slug === c.slug)._id),
          },
          {
            attribute_id: sizeAttribute._id,
            attribute_name: sizeAttribute.name,
            attribute_slug: sizeAttribute.slug,
            value_ids: availableSizes.map((s) => sizeAttribute.values.find((v) => v.slug === slugify(s))._id),
          },
        ],
        variants,
        business_enabled: true,
        is_deleted: false,
        deletedAt: null,
        embedding_vector: [],
      })
    }

    const insertedProducts = await Product.insertMany(productDocsToInsert)
    const totalVariantsCount = insertedProducts.reduce((sum, p) => sum + p.variants.length, 0)
    console.log(`✅ Đã tạo thành công ${insertedProducts.length} sản phẩm và ${totalVariantsCount} biến thể.`)

    // Step E: Seed 50 Users (1 Admin + 49 Customers)
    console.log('👥 Đang tạo 50 người dùng (1 Admin + 49 Customers)...')
    const passwordHash = await bcrypt.hash('Password123!', 10)

    const userDocsToInsert = [
      {
        name: 'Quản Trị Viên (Admin)',
        email: 'admin@fashion.com',
        password: passwordHash,
        role: 'admin',
        phone: '0901234567',
        address: 'Số 1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội',
      },
    ]

    for (let i = 1; i <= 49; i++) {
      const fn = getRandomChoice(FIRST_NAMES)
      const mn = getRandomChoice(MIDDLE_NAMES)
      const ln = getRandomChoice(LAST_NAMES)
      const name = `${fn} ${mn} ${ln}`
      const email = `user${i}@gmail.com`
      const phone = `09${getRandomInt(10000000, 99999999)}`
      const address = CITIES_AND_ADDRESSES[i % CITIES_AND_ADDRESSES.length]

      userDocsToInsert.push({
        name,
        email,
        password: passwordHash,
        role: 'customer',
        phone,
        address,
      })
    }

    const insertedUsers = await User.insertMany(userDocsToInsert)
    const customerUsers = insertedUsers.filter((u) => u.role === 'customer')
    console.log(`✅ Đã tạo thành công ${insertedUsers.length} tài khoản người dùng.`)

    // Step F: Seed ~250 Orders & Status Timelines over the past 6 months
    console.log('📜 Đang tạo ~250 Đơn hàng rải đều 6 tháng và Timeline lịch sử...')
    const orderDocsToInsert = []
    const paymentTxnToInsert = []
    const reviewDocsToInsert = []

    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    for (let i = 1; i <= 260; i++) {
      const customer = customerUsers[i % customerUsers.length]
      // Pick random date within 6 months
      const createdTimeMs = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
      const orderDate = new Date(createdTimeMs)

      // Format order code: ORD-YYYYMMDD-XXXX
      const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '')
      const orderCode = `ORD-${dateStr}-${String(i).padStart(4, '0')}`

      // Pick 1-3 random products & variants for order
      const orderItemCount = getRandomInt(1, 3)
      const orderItems = []
      let totalAmount = 0

      for (let j = 0; j < orderItemCount; j++) {
        const prod = getRandomChoice(insertedProducts)
        const variant = getRandomChoice(prod.variants)
        const qty = getRandomInt(1, 2)
        const itemPrice = variant.sale_price || variant.base_price

        totalAmount += itemPrice * qty

        const colorImgAsset = prod.image_assets.find(a => String(a._id) === String(variant.image_asset_ids[0]))
        const imageUrl = colorImgAsset ? colorImgAsset.url : (prod.images[0] || '')

        orderItems.push({
          product_id: prod._id,
          product_name: prod.name,
          variant_sku: variant.sku,
          image_url: imageUrl,
          color: variant.color,
          size: variant.size,
          selected_options: variant.option_values.map((ov) => ({
            attribute_name: ov.attribute_name,
            attribute_slug: ov.attribute_slug,
            value_name: ov.value_name,
            value_slug: ov.value_slug,
          })),
          quantity: qty,
          price: itemPrice,
        })
      }

      // Order Status Distribution: 70% completed, 15% shipped, 10% processing, 5% canceled
      const statusRoll = Math.random()
      let status = 'completed'
      if (statusRoll > 0.95) status = 'canceled'
      else if (statusRoll > 0.85) status = 'processing'
      else if (statusRoll > 0.70) status = 'shipped'

      const isVnPay = Math.random() < 0.4
      const paymentMethod = isVnPay ? 'VNPAY' : 'COD'
      let paymentStatus = 'paid'
      if (status === 'canceled') paymentStatus = 'failed'
      else if (status === 'processing' && !isVnPay) paymentStatus = 'cod_pending'

      // Build realistic status history timeline
      const statusHistory = [
        {
          event: 'order_created',
          occurred_at: orderDate,
          actor_type: 'customer',
          actor_id: customer._id,
          note: 'Đơn hàng được tạo thành công.',
        },
      ]

      if (paymentStatus === 'paid') {
        statusHistory.push({
          event: 'payment_confirmed',
          occurred_at: new Date(orderDate.getTime() + 5 * 60 * 1000),
          actor_type: 'system',
          actor_id: null,
          note: isVnPay ? 'Thanh toán thành công qua VNPAY.' : 'Xác nhận thanh toán COD.',
        })
      }

      if (status === 'processing' || status === 'shipped' || status === 'completed') {
        statusHistory.push({
          event: 'processing',
          occurred_at: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000),
          actor_type: 'admin',
          actor_id: insertedUsers[0]._id,
          note: 'Đơn hàng đang được chuẩn bị và đóng gói.',
        })
      }

      if (status === 'shipped' || status === 'completed') {
        const shippedTime = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000)
        statusHistory.push(
          {
            event: 'ready_to_ship',
            occurred_at: new Date(orderDate.getTime() + 20 * 60 * 60 * 1000),
            actor_type: 'admin',
            actor_id: insertedUsers[0]._id,
            note: 'Đơn hàng đã bàn giao cho đơn vị vận chuyển GHN.',
          },
          {
            event: 'shipped',
            occurred_at: shippedTime,
            actor_type: 'system',
            actor_id: null,
            note: 'Đơn hàng đang trên đường giao tới người nhận.',
          },
        )
      }

      if (status === 'completed') {
        statusHistory.push({
          event: 'completed',
          occurred_at: new Date(orderDate.getTime() + 72 * 60 * 60 * 1000),
          actor_type: 'customer',
          actor_id: customer._id,
          note: 'Khách hàng đã nhận hàng và hoàn tất đơn hàng.',
        })
      } else if (status === 'canceled') {
        statusHistory.push({
          event: 'canceled',
          occurred_at: new Date(orderDate.getTime() + 30 * 60 * 1000),
          actor_type: 'customer',
          actor_id: customer._id,
          note: 'Khách hàng hủy đơn hàng.',
        })
      }

      const orderDoc = {
        _id: new mongoose.Types.ObjectId(),
        order_code: orderCode,
        user_id: customer._id,
        shipping_address: customer.address,
        phone_number: customer.phone,
        note: i % 7 === 0 ? 'Giao hàng giờ hành chính giúp em ạ' : '',
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_expires_at: isVnPay ? new Date(orderDate.getTime() + 30 * 60 * 1000) : null,
        status,
        status_history: statusHistory,
        items: orderItems,
        createdAt: orderDate,
        updatedAt: statusHistory[statusHistory.length - 1].occurred_at,
      }

      orderDocsToInsert.push(orderDoc)

      // PaymentTransaction for VNPAY/Paid orders
      if (isVnPay || paymentStatus === 'paid') {
        paymentTxnToInsert.push({
          txn_ref: `TXN-${orderCode}`,
          order_id: orderDoc._id,
          user_id: customer._id,
          provider: 'VNPAY',
          amount: totalAmount,
          status: paymentStatus === 'paid' ? 'paid' : 'failed',
          expires_at: new Date(orderDate.getTime() + 30 * 60 * 1000),
          vnp_transaction_no: `VNP${10000000 + i}`,
          response_code: paymentStatus === 'paid' ? '00' : '24',
          transaction_status: paymentStatus === 'paid' ? '00' : '02',
          pay_date: dateStr + '120000',
          processed_at: new Date(orderDate.getTime() + 5 * 60 * 1000),
        })
      }

      // Generate Reviews for Completed Orders (~300 reviews)
      if (status === 'completed') {
        for (const item of orderItems) {
          const ratingRoll = Math.random()
          let rating = 5
          let reviewContent = getRandomChoice(REVIEWS_5_STAR)

          if (ratingRoll > 0.97) {
            rating = getRandomInt(1, 2)
            reviewContent = getRandomChoice(REVIEWS_LOW_STAR)
          } else if (ratingRoll > 0.90) {
            rating = 3
            reviewContent = getRandomChoice(REVIEWS_3_STAR)
          } else if (ratingRoll > 0.70) {
            rating = 4
            reviewContent = getRandomChoice(REVIEWS_4_STAR)
          }

          reviewDocsToInsert.push({
            userId: customer._id,
            productId: item.product_id,
            variantSku: item.variant_sku,
            color: item.color,
            size: item.size,
            selectedOptions: item.selected_options,
            rating,
            content: reviewContent,
            createdAt: new Date(orderDate.getTime() + (75 + Math.random() * 48) * 3600 * 1000),
          })
        }
      }
    }

    const insertedOrders = await Order.insertMany(orderDocsToInsert)
    console.log(`✅ Đã tạo thành công ${insertedOrders.length} đơn hàng.`)

    if (paymentTxnToInsert.length > 0) {
      await PaymentTransaction.insertMany(paymentTxnToInsert)
      console.log(`✅ Đã tạo thành công ${paymentTxnToInsert.length} giao dịch thanh toán.`)
    }

    // Insert Reviews ensuring unique index ({ userId: 1, productId: 1, variantSku: 1 })
    const uniqueReviewMap = new Map()
    for (const rev of reviewDocsToInsert) {
      const key = `${rev.userId}-${rev.productId}-${rev.variantSku}`
      if (!uniqueReviewMap.has(key)) {
        uniqueReviewMap.set(key, rev)
      }
    }
    const finalReviewsToInsert = Array.from(uniqueReviewMap.values())
    const insertedReviews = await Review.insertMany(finalReviewsToInsert)
    console.log(`✅ Đã tạo thành công ${insertedReviews.length} đánh giá sản phẩm.`)

    // Step G: Seed Active Carts for 20 users
    console.log('🛒 Đang tạo Giỏ hàng (Cart) cho 20 khách hàng...')
    const cartDocsToInsert = []
    for (let i = 0; i < 20; i++) {
      const customer = customerUsers[i]
      const cartItemsCount = getRandomInt(1, 3)
      const items = []

      for (let j = 0; j < cartItemsCount; j++) {
        const prod = getRandomChoice(insertedProducts)
        const variant = getRandomChoice(prod.variants)
        items.push({
          product_id: prod._id,
          variant_sku: variant.sku,
          quantity: getRandomInt(1, 2),
        })
      }

      cartDocsToInsert.push({
        user_id: customer._id,
        items,
      })
    }
    await Cart.insertMany(cartDocsToInsert)
    console.log(`✅ Đã tạo thành công ${cartDocsToInsert.length} giỏ hàng.`)

    // Step H: Seed Wishlists for 30 users
    console.log('❤️ Đang tạo Danh sách yêu thích (Wishlist) cho 30 khách hàng...')
    const wishlistDocsToInsert = []
    for (let i = 0; i < 30; i++) {
      const customer = customerUsers[i]
      const sampledProds = getRandomSample(insertedProducts, getRandomInt(2, 5))

      for (const prod of sampledProds) {
        wishlistDocsToInsert.push({
          user_id: customer._id,
          product_id: prod._id,
        })
      }
    }
    await WishlistItem.insertMany(wishlistDocsToInsert)
    console.log(`✅ Đã tạo thành công ${wishlistDocsToInsert.length} sản phẩm trong danh sách yêu thích.`)

    console.log('====================================================')
    console.log('🎉 TỔNG KẾT BỘ SEED DỮ LIỆU MASTER HOÀN THÀNH:')
    console.log(`- Brands: ${brandDocs.size}`)
    console.log(`- Categories: ${categoryDocs.size}`)
    console.log(`- Parent Products: ${insertedProducts.length}`)
    console.log(`- Product Variants: ${totalVariantsCount}`)
    console.log(`- Users: ${insertedUsers.length} (1 Admin + 49 Customers)`)
    console.log(`- Orders: ${insertedOrders.length}`)
    console.log(`- Reviews: ${insertedReviews.length}`)
    console.log(`- Payment Transactions: ${paymentTxnToInsert.length}`)
    console.log(`- Carts: ${cartDocsToInsert.length}`)
    console.log(`- Wishlist Items: ${wishlistDocsToInsert.length}`)
    console.log('====================================================')
  } catch (error) {
    console.error('❌ Lỗi khi thực thi seedMasterData:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Đã ngắt kết nối MongoDB.')
  }
}

seedMasterData()
