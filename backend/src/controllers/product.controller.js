import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { getTextEmbedding, buildProductEmbeddingText } from '../services/ai.service.js';

// Lấy danh sách sản phẩm (Có phân trang & lọc cơ bản)
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'newest' ? { createdAt: -1, _id: -1 } : {};

    const query = { is_deleted: false, status: 'available' };
    
    if (req.query.category) query.category_id = req.query.category;
    if (req.query.brand) query.brand = req.query.brand;

    const products = await Product.find(query).sort(sort).skip(skip).limit(limit);
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total_items: total,
        current_page: page,
        total_pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết 1 sản phẩm
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, is_deleted: false, status: 'available', business_enabled: { $ne: false } }).populate('brand_id', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    const row = product.toObject();
    const assetMap = new Map((row.image_assets || []).map((asset) => [String(asset._id), asset.url]));
    const gallery = (row.gallery_asset_ids || []).map((id) => assetMap.get(String(id))).filter(Boolean);
    if (gallery.length) row.images = gallery;
    const prices = row.variants.filter((variant) => variant.stock > 0).map((variant) => variant.sale_price ?? variant.base_price ?? row.sale_price ?? row.base_price);
    row.variants = row.variants.map((variant) => ({ ...variant, effective_price: variant.sale_price ?? variant.base_price ?? row.sale_price ?? row.base_price, images: (variant.image_asset_ids || []).map((id) => assetMap.get(String(id))).filter(Boolean) }));
    row.min_price = prices.length ? Math.min(...prices) : row.sale_price ?? row.base_price;
    row.max_price = prices.length ? Math.max(...prices) : row.min_price;
    res.status(200).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm mới sản phẩm (Admin) - Tự động đồng bộ Vector Embedding với AI Worker
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Tự động tạo category_id nếu không được truyền vào
    if (!productData.category_id) {
      productData.category_id = new mongoose.Types.ObjectId();
    }

    // Tự động sinh mảng embedding_vector nếu chưa có
    if (!productData.embedding_vector || productData.embedding_vector.length === 0) {
      const textToEmbed = buildProductEmbeddingText(productData);
      const vector = await getTextEmbedding(textToEmbed);
      if (vector && vector.length === 384) {
        productData.embedding_vector = vector;
      }
    }

    const newProduct = await Product.create(productData);
    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: newProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin sản phẩm (Admin) - Tự động cập nhật lại Vector Embedding nếu sửa Tên/Mô tả/Brand
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const productId = req.params.id;

    // Nếu có thay đổi tên, mô tả hoặc thương hiệu -> Tự động sinh lại vector mới
    if (updateData.name || updateData.description || updateData.brand) {
      const existingProduct = await Product.findById(productId);
      if (existingProduct) {
        const mergedProduct = { ...existingProduct.toObject(), ...updateData };
        const textToEmbed = buildProductEmbeddingText(mergedProduct);
        const vector = await getTextEmbedding(textToEmbed);
        if (vector && vector.length === 384) {
          updateData.embedding_vector = vector;
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa mềm sản phẩm (Admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { is_deleted: true }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API Seed Data Test (Dùng gọi 1 lần để tạo data mẫu vào DB)
export const seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({}); // Xóa dữ liệu cũ nếu muốn làm sạch
    const sampleProducts = [
      // 1. ÁO CHỐNG NẮNG & ĐỒ ĐI NẮNG
      {
        name: "Áo Khoác Chống Nắng Nữ Vải Thun Lạnh UPF 50+ Chống Tia UV Cao Cấp",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Áo chống nắng nữ cao cấp có mũ trùm đầu và tay xỏ ngón che mu bàn tay, chất liệu thun lạnh AIRism công nghệ dệt chống nắng cản tia UV UPF 50+, thoáng mát thấm hút mồ hôi áo khoác đi nắng xe máy mùa hè.",
        base_price: 380000,
        sale_price: 329000,
        images: ["https://images.unsplash.com/photo-1544441893-675973e31985?w=500"],
        variants: [
          { sku: "ACN-BLU-M", color: "Blue", size: "M", stock: 25 },
          { sku: "ACN-PNK-L", color: "Pink", size: "L", stock: 20 },
          { sku: "ACN-GRY-XL", color: "White", size: "XL", stock: 15 }
        ]
      },
      {
        name: "Áo Khoác Nắng Nam Toàn Thân Có Mũ Trùm Vải Dệt Thoáng Khí Chống Tia UV",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Denim Co",
        description: "Áo nắng nam form rộng thoải mái, chất vải dệt tổ ong thông hơi tản nhiệt, chống tia tử ngoại UV, áo khoác đi nắng cho nam giới lái xe hoạt động ngoài trời.",
        base_price: 420000,
        sale_price: 360000,
        images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500"],
        variants: [
          { sku: "ANN-GRY-L", color: "Black", size: "L", stock: 30 },
          { sku: "ANN-GRY-XL", color: "Black", size: "XL", stock: 20 }
        ]
      },

      // 2. ĐỒ BƠI & ÁO TẮM ĐI BIỂN
      {
        name: "Bộ Đồ Bơi Bikini 2 Mảnh Áo Tắm Nữ Đi Biển Tôn Dáng Sexy",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Set bikini 2 mảnh áo tắm nữ gợi cảm, thiết kế buộc dây quyến rũ thời trang bãi biển mùa hè, đồ bơi đi bơi resort du lịch.",
        base_price: 480000,
        sale_price: 390000,
        images: ["https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500"],
        variants: [
          { sku: "BK-PNK-S", color: "Pink", size: "S", stock: 12 },
          { sku: "BK-PNK-M", color: "Pink", size: "M", stock: 18 }
        ]
      },
      {
        name: "Đồ Bơi Nữ 1 Mảnh Liền Thân Áo Tắm Đi Biển Kín Đáo Quyến Rũ",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Bộ đồ bơi một mảnh áo tắm nữ liền thân cao cấp, chất vải thun bơi chống clo và tia UV, co giãn 4 chiều ôm sát tôn dáng đi biển và hồ bơi.",
        base_price: 520000,
        sale_price: 450000,
        images: ["https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=500"],
        variants: [
          { sku: "SW-BLK-S", color: "Black", size: "S", stock: 15 },
          { sku: "SW-BLK-M", color: "Black", size: "M", stock: 20 }
        ]
      },
      {
        name: "Quần Bơi Nam Đi Biển Họa Tiết Sóng Biển Co Giãn Nhanh Khô",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Local Brand X",
        description: "Quần short bơi nam đi biển dạo mát, chất liệu dù nhẹ mau khô, lưng thun co giãn có dây rút đi bơi lướt sóng dã ngoại.",
        base_price: 260000,
        sale_price: 210000,
        images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500"],
        variants: [
          { sku: "QB-BLU-M", color: "Blue", size: "M", stock: 25 },
          { sku: "QB-BLU-L", color: "Blue", size: "L", stock: 30 }
        ]
      },

      // 3. ĐỒ CÔNG SỞ & LỊCH SỰ
      {
        name: "Áo Sơ Mi Lụa Cổ V Premium Màu Hồng Pastel Thanh Lịch",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Áo sơ mi lụa tơ tằm mềm mại rủ nhẹ tôn dáng, cổ V sang trọng thoáng mát, áo công sở dự tiệc lịch sự phong cách quý cô.",
        base_price: 650000,
        sale_price: 590000,
        images: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500"],
        variants: [
          { sku: "SM-PNK-S", color: "Pink", size: "S", stock: 10 },
          { sku: "SM-PNK-M", color: "Pink", size: "M", stock: 15 }
        ]
      },
      {
        name: "Áo Sơ Mi Trắng Công Sở Dài Tay Chống Nhăn Lịch Lãm Nam Nữ",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Áo sơ mi trắng cổ đức chất liệu cotton poplin pha spandex chống nhăn, form đứng chuẩn mực đi làm văn phòng hội thảo sự kiện trang trọng.",
        base_price: 490000,
        sale_price: 420000,
        images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500"],
        variants: [
          { sku: "SM-WHT-M", color: "White", size: "M", stock: 25 },
          { sku: "SM-WHT-L", color: "White", size: "L", stock: 20 }
        ]
      },
      {
        name: "Quần Tây Âu Baggy Hàn Quốc Đen Tuyển Xếp Ly Đứng Dáng",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Quần tây âu nam nữ ống rộng thoải mái trẻ trung, chất vải tuyết mưa cao cấp đứng dáng, phối áo sơ mi công sở chuẩn đẹp lịch sự.",
        base_price: 500000,
        sale_price: 450000,
        images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500"],
        variants: [
          { sku: "QTA-BLK-M", color: "Black", size: "M", stock: 18 },
          { sku: "QTA-BLK-L", color: "Black", size: "L", stock: 22 },
          { sku: "QTA-BLK-XL", color: "Black", size: "XL", stock: 10 }
        ]
      },
      {
        name: "Chân Váy Bút Chì Công Sở Xẻ Sau Tôn Dáng Nữ Quyến Rũ",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Chân váy công sở dáng ôm bút chì xẻ tà sau thanh lịch, cạp cao tôn eo thon dài chân, thời trang nữ đi làm văn phòng đi họp.",
        base_price: 390000,
        sale_price: 330000,
        images: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500"],
        variants: [
          { sku: "CV-BLK-S", color: "Black", size: "S", stock: 12 },
          { sku: "CV-BLK-M", color: "Black", size: "M", stock: 15 }
        ]
      },

      // 4. ĐẦM & VÁY DẠ TIỆC SANG TRỌNG
      {
        name: "Áo Blazer Dạ Tweed Nữ Thanh Lịch Dự Tiệc Sang Trọng Quý Phái",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Áo khoác blazer croptop dạ tweed phối cúc ngọc trai kim loại sang trọng, chuẩn phong cách tiểu thư đài các dự tiệc cưới, prom cao cấp dạ hội.",
        base_price: 950000,
        sale_price: 850000,
        images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500"],
        variants: [
          { sku: "BLZ-TWD-S", color: "White", size: "S", stock: 14 },
          { sku: "BLZ-TWD-M", color: "White", size: "M", stock: 10 }
        ]
      },
      {
        name: "Đầm Lụa Maxi Tôn Dáng Dạ Tiệc Cao Cấp Xẻ Tà Quyến Rũ",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Váy đầm dạ hội dạ tiệc maxi lụa satin 2 dây xẻ tà quyến rũ, thiết kế ôm eo tôn dáng cho các buổi tiệc tối sang trọng đám cưới event.",
        base_price: 1200000,
        sale_price: 1050000,
        images: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500"],
        variants: [
          { sku: "DRS-BLK-S", color: "Black", size: "S", stock: 8 },
          { sku: "DRS-BLK-M", color: "Black", size: "M", stock: 12 }
        ]
      },
      {
        name: "Đầm Xòe Hoa Nhí Vintage Mùa Hè Dạo Phố Dễ Thương",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Váy đầm hoa nhí voan tơ mềm mại mùa hè, thiết kế tay bồng xòe nữ tính phong cách vintage dạo phố chụp ảnh sống ảo du lịch nhẹ nhàng.",
        base_price: 450000,
        sale_price: 390000,
        images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"],
        variants: [
          { sku: "DX-YLW-S", color: "Yellow", size: "S", stock: 15 },
          { sku: "DX-YLW-M", color: "Yellow", size: "M", stock: 18 }
        ]
      },

      // 5. ĐỒ THỂ THAO, GYM, YOGA
      {
        name: "Set Đồ Tập Gym Yoga Nữ Áo Bra Nâng Ngực & Quần Legging Cạp Cao",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Bộ quần áo thể thao nữ tập gym yoga aerobic chạy bộ, áo bra đệm mút nâng ngực và quần legging dệt kim co giãn 4 chiều định hình hông mông thể thao khỏe khoắn.",
        base_price: 580000,
        sale_price: 490000,
        images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500"],
        variants: [
          { sku: "GYM-PUR-S", color: "Purple", size: "S", stock: 15 },
          { sku: "GYM-PUR-M", color: "Purple", size: "M", stock: 20 }
        ]
      },
      {
        name: "Quần Short Thể Thao Năng Động Chạy Bộ Co Giãn Nhanh Khô",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Local Brand X",
        description: "Quần short đùi thể thao nam nữ 2 lớp tập gym chạy bộ, thoáng khí nhẹ tênh cho các hoạt động thể thao ngoài trời đá bóng tập luyện.",
        base_price: 250000,
        sale_price: 199000,
        images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500"],
        variants: [
          { sku: "SH-BLK-S", color: "Black", size: "S", stock: 35 },
          { sku: "SH-BLK-M", color: "Black", size: "M", stock: 40 },
          { sku: "SH-BLK-L", color: "Black", size: "L", stock: 30 }
        ]
      },

      // 6. ĐỒ NGỦ & HOMENWEAR
      {
        name: "Bộ Pijama Lụa Satin Cao Cấp Mặc Nhà Tay Ngắn Quần Dài",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Bộ đồ ngủ pijama lụa cao cấp mặc ở nhà mịn mát không nhăn, viền cổ sang trọng đem lại giấc ngủ êm ái thư giãn đồ bộ nữ.",
        base_price: 420000,
        sale_price: 360000,
        images: ["https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500"],
        variants: [
          { sku: "PJ-PNK-M", color: "Pink", size: "M", stock: 15 },
          { sku: "PJ-BLU-L", color: "Blue", size: "L", stock: 12 }
        ]
      },
      {
        name: "Váy Ngủ Lụa 2 Dây Phối Ren Quyến Rũ Thoáng Mát",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Đầm ngủ váy ngủ lụa satin 2 dây phối ren ngực sexy gợi cảm mặc nhà thoải mái quyến rũ tôn dáng mềm mại ban đêm.",
        base_price: 350000,
        sale_price: 290000,
        images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500"],
        variants: [
          { sku: "VN-WHT-S", color: "White", size: "S", stock: 10 },
          { sku: "VN-BLK-M", color: "Black", size: "M", stock: 14 }
        ]
      },

      // 7. ĐỒ MÙA ĐÔNG & GIỮ ẤM
      {
        name: "Áo Khoác Phao Lông Vũ Dáng Dài Siêu Nhẹ Siêu Ấm Mùa Đông",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Áo khoác phao nữ đại hàn mùa đông trần bông lông vũ siêu ấm cản gió chống nước mưa nhẹ, áo ấm trời lạnh có mũ lông sang xịn ấm áp.",
        base_price: 1100000,
        sale_price: 950000,
        images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500"],
        variants: [
          { sku: "AP-BLK-M", color: "Black", size: "M", stock: 12 },
          { sku: "AP-BLK-L", color: "Black", size: "L", stock: 15 }
        ]
      },
      {
        name: "Áo Len Cổ Lọ Dệt Kim Dày Dặn Phong Cách Hàn Quốc Giữ Ấm",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Denim Co",
        description: "Áo len cổ lọ nam nữ dệt kim sợi len cừu giữ ấm mùa đông, form suông dày dặn mềm mịn không ngứa phối áo khoác dạ cực đẹp.",
        base_price: 490000,
        sale_price: 420000,
        images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500"],
        variants: [
          { sku: "AL-BEI-M", color: "White", size: "M", stock: 18 },
          { sku: "AL-BEI-L", color: "White", size: "L", stock: 14 }
        ]
      },
      {
        name: "Áo Hoodie Unisex Basic Nỉ Bông Dày Dặn Dáng Rộng",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Aesthetix Studio",
        description: "Áo hoodie nỉ bông trơn có mũ form rộng phong cách streetwear cá tính, chất nỉ bông dày dặn ấm áp cho ngày lạnh mùa đông thu đông.",
        base_price: 480000,
        sale_price: 399000,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"],
        variants: [
          { sku: "HD-YEL-S", color: "Yellow", size: "S", stock: 10 },
          { sku: "HD-YEL-M", color: "Yellow", size: "M", stock: 15 }
        ]
      },

      // 8. STREETWEAR & HÀNG NGÀY
      {
        name: "Áo Thun Streetwear Form Rộng Oversize In Họa Tiết Vintage",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Local Brand X",
        description: "Áo thun tay lỡ form rộng unisex 100% cotton 2 chiều 250gsm dày dặn thoáng mát, in hình retro graphic streetwear cá tính dạo phố.",
        base_price: 350000,
        sale_price: 299000,
        images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"],
        variants: [
          { sku: "TS-BLK-M", color: "Black", size: "M", stock: 25 },
          { sku: "TS-BLK-L", color: "Black", size: "L", stock: 30 }
        ]
      },
      {
        name: "Áo Thun Baby Tee Nữ Trắng Ôm Dáng Cá Tính Trẻ Trung",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Local Brand X",
        description: "Áo thun baby tee crop top nữ ôm body tôn vòng eo thon gọn, chất thun cotton co giãn tốt năng động thời thượng phong cách y2k.",
        base_price: 180000,
        sale_price: 159000,
        images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500"],
        variants: [
          { sku: "BT-WHT-S", color: "White", size: "S", stock: 20 },
          { sku: "BT-WHT-M", color: "White", size: "M", stock: 25 }
        ]
      },
      {
        name: "Áo Polo Dệt Kim Trơn Lịch Lãm Nam Cổ Bẻ Xanh Navy",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Denim Co",
        description: "Áo polo dệt kim nam cao cấp cổ bẻ thanh lịch tôn nét nam tính phong độ, chất dệt mềm mát co giãn mặc đi làm đi chơi lịch sự.",
        base_price: 380000,
        sale_price: 320000,
        images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500"],
        variants: [
          { sku: "PL-BLU-M", color: "Blue", size: "M", stock: 20 },
          { sku: "PL-BLU-L", color: "Blue", size: "L", stock: 15 }
        ]
      },
      {
        name: "Áo Khoác Bomber Varsity Jacket Phối Da Cổ Điển Đường Phố",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Áo khoác bomber bóng chày thêu họa tiết cá tính đường phố streetwear, chất dạ phối tay da cực ngầu ấm áp.",
        base_price: 850000,
        sale_price: 750000,
        images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
        variants: [
          { sku: "JK-PUR-M", color: "Purple", size: "M", stock: 12 },
          { sku: "JK-PUR-L", color: "Purple", size: "L", stock: 15 }
        ]
      },
      {
        name: "Quần Jeans Nam Slimfit Xanh Đậm Co Giãn Bền Đẹp",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Denim Co",
        description: "Quần jeans bò nam dáng ôm vừa slim fit màu xanh chàm cổ điển, chất denim dệt cotton co giãn bền màu không bai xù dễ phối áo thun sơ mi.",
        base_price: 550000,
        sale_price: 490000,
        images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"],
        variants: [
          { sku: "JN-BLU-M", color: "Blue", size: "M", stock: 18 },
          { sku: "JN-BLU-L", color: "Blue", size: "L", stock: 20 }
        ]
      },
      {
        name: "Quần Kaki Chino Slim-Fit Trắng Cát Lịch Lãm Hàn Quốc",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Quần dài kaki chino nam trắng cát phong cách quý ông Hàn Quốc lịch lãm, chất vải mềm đứng dáng dễ phối cùng áo polo và sơ mi.",
        base_price: 420000,
        sale_price: 370000,
        images: ["https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=500"],
        variants: [
          { sku: "KK-WHT-M", color: "White", size: "M", stock: 25 },
          { sku: "KK-WHT-L", color: "White", size: "L", stock: 15 }
        ]
      },
      {
        name: "Quần Ống Suông Linen Thoáng Mát Mùa Hè Cạp Cao Hack Dáng",
        category_id: new mongoose.Types.ObjectId(),
        brand: "Urban Wear",
        description: "Quần dài ống suông nữ chất vải đũi linen tự nhiên mềm nhẹ thoáng khí, cạp cao lưng thun tôn dáng phong cách vintage tối giản mùa hè.",
        base_price: 450000,
        sale_price: 390000,
        images: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500"],
        variants: [
          { sku: "QOS-BEI-M", color: "White", size: "M", stock: 20 },
          { sku: "QOS-BEI-L", color: "White", size: "L", stock: 15 }
        ]
      }
    ];

    // Tự động sinh Vector Embedding 384 chiều từ AI Worker cho dữ liệu mẫu
    for (const p of sampleProducts) {
      if (!p.embedding_vector || p.embedding_vector.length !== 384) {
        const text = buildProductEmbeddingText(p);
        const vector = await getTextEmbedding(text);
        if (vector && vector.length === 384) {
          p.embedding_vector = vector;
        }
      }
    }

    const created = await Product.insertMany(sampleProducts);
    res.status(200).json({ success: true, message: `Đã seed thành công ${created.length} sản phẩm mẫu kèm Vector Embeddings!`, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
