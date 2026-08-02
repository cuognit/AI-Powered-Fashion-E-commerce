import "dotenv/config";
import mongoose from "mongoose";
import Product from "./src/models/product.model.js";

const sampleProducts = [
  {
    name: "Áo Thun Streetwear Form Rộng Oversize",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Local Brand X",
    description: "Chất liệu cotton 100%, thoáng mát, phong cách đường phố năng động.",
    base_price: 350000,
    sale_price: 299000,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"],
    variants: [
      { sku: "TS-BLK-M", color: "Black", size: "M", stock: 15 },
      { sku: "TS-BLK-L", color: "Black", size: "L", stock: 20 },
      { sku: "TS-WHT-M", color: "White", size: "M", stock: 10 }
    ],
    embedding_vector: [0.1, 0.2, 0.3]
  },
  {
    name: "Quần Jeans Nam Slimfit Xanh Đậm",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Denim Co",
    description: "Quần jeans co giãn nhẹ, tôn dáng, dễ phối đồ.",
    base_price: 550000,
    sale_price: null,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"],
    variants: [
      { sku: "JN-BLU-M", color: "Blue", size: "M", stock: 8 },
      { sku: "JN-BLU-L", color: "Blue", size: "L", stock: 12 }
    ]
  },
  {
    name: "Áo Hoodie Unisex Basic Nỉ Bông",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Aesthetix Studio",
    description: "Chất nỉ bông dày dặn, ấm áp cho những ngày lạnh, thiết kế basic dễ phối.",
    base_price: 480000,
    sale_price: 399000,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"],
    variants: [
      { sku: "HD-YEL-S", color: "Yellow", size: "S", stock: 10 },
      { sku: "HD-YEL-M", color: "Yellow", size: "M", stock: 5 },
      { sku: "HD-YEL-L", color: "Yellow", size: "L", stock: 0 }
    ]
  },
  {
    name: "Quần Kaki Chino Slim-Fit Trắng Cát",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Urban Wear",
    description: "Quần kaki kiểu dáng Hàn Quốc lịch lãm, thích hợp đi làm lẫn dạo phố.",
    base_price: 420000,
    sale_price: null,
    images: ["https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=500"],
    variants: [
      { sku: "KK-WHT-M", color: "White", size: "M", stock: 25 },
      { sku: "KK-WHT-L", color: "White", size: "L", stock: 14 },
      { sku: "KK-WHT-XL", color: "White", size: "XL", stock: 5 }
    ]
  },
  {
    name: "Áo Sơ Mi Lụa Cổ V Premium Màu Hồng",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Aesthetix Studio",
    description: "Chất lụa mềm mại rủ nhẹ tôn dáng, thoáng mát và sang trọng.",
    base_price: 650000,
    sale_price: 590000,
    images: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500"],
    variants: [
      { sku: "SM-PNK-S", color: "Pink", size: "S", stock: 8 },
      { sku: "SM-PNK-M", color: "Pink", size: "M", stock: 15 }
    ]
  },
  {
    name: "Quần Short Thể Thao Năng Động",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Local Brand X",
    description: "Quần short co giãn thích hợp cho các hoạt động thể thao ngoài trời.",
    base_price: 250000,
    sale_price: 199000,
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500"],
    variants: [
      { sku: "SH-BLK-S", color: "Black", size: "S", stock: 50 },
      { sku: "SH-BLK-M", color: "Black", size: "M", stock: 40 },
      { sku: "SH-BLK-L", color: "Black", size: "L", stock: 30 },
      { sku: "SH-BLK-XL", color: "Black", size: "XL", stock: 20 }
    ]
  },
  {
    name: "Áo Khoác Bomber Varsity Jacket Tím Cổ Điển",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Urban Wear",
    description: "Áo khoác bóng chày thêu họa tiết cá tính, chất dạ phối da cực ngầu.",
    base_price: 850000,
    sale_price: null,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
    variants: [
      { sku: "JK-PUR-M", color: "Purple", size: "M", stock: 10 },
      { sku: "JK-PUR-L", color: "Purple", size: "L", stock: 8 },
      { sku: "JK-PUR-XL", color: "Purple", size: "XL", stock: 3 }
    ],
    embedding_vector: [0.4, 0.5, 0.6]
  },
  {
    name: "Áo Thun Baby Tee Nữ Trắng Cá Tính",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Local Brand X",
    description: "Thiết kế ôm dáng quyến rũ, trẻ trung năng động, thun cotton co giãn tốt.",
    base_price: 180000,
    sale_price: null,
    images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500"],
    variants: [
      { sku: "BT-WHT-S", color: "White", size: "S", stock: 18 },
      { sku: "BT-WHT-M", color: "White", size: "M", stock: 22 }
    ]
  },
  {
    name: "Quần Tây Âu Baggy Hàn Quốc Đen Tuyển",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Aesthetix Studio",
    description: "Quần tây ống rộng thoải mái trẻ trung, chất vải tuyết mưa đứng dáng.",
    base_price: 500000,
    sale_price: 450000,
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500"],
    variants: [
      { sku: "QTA-BLK-M", color: "Black", size: "M", stock: 12 },
      { sku: "QTA-BLK-L", color: "Black", size: "L", stock: 15 },
      { sku: "QTA-BLK-XL", color: "Black", size: "XL", stock: 8 }
    ]
  },
  {
    name: "Áo Polo Dệt Kim Trơn Lịch Lãm Xanh",
    category_id: new mongoose.Types.ObjectId(),
    brand: "Denim Co",
    description: "Chất dệt kim cao cấp, cổ bẻ thanh lịch tôn nét nam tính cuốn hút.",
    base_price: 380000,
    sale_price: 320000,
    images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500"],
    variants: [
      { sku: "PL-BLU-M", color: "Blue", size: "M", stock: 20 },
      { sku: "PL-BLU-L", color: "Blue", size: "L", stock: 15 },
      { sku: "PL-BLU-XL", color: "Blue", size: "XL", stock: 12 }
    ]
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Lỗi: MONGODB_URI chưa được cấu hình trong file .env!");
    process.exit(1);
  }

  try {
    console.log("Đang kết nối tới MongoDB...");
    await mongoose.connect(uri);
    console.log(
      "Đã kết nối thành công. Đang xóa dữ liệu cũ và nạp dữ liệu mới...",
    );

    await Product.deleteMany({});
    const created = await Product.insertMany(sampleProducts);

    console.log(
      `Bơm dữ liệu thành công! Đã nạp ${created.length} sản phẩm mẫu vào MongoDB Atlas.`,
    );
  } catch (error) {
    console.error("Lỗi khi seed data:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Đã ngắt kết nối database.");
  }
}

seed();
