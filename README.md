# 👗 AI-Powered Fashion E-commerce Platform

<div align="center">

![Project Banner](https://img.shields.io/badge/Platform-Fashion_E--Commerce-000000?style=for-the-badge&logo=shopify&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![VNPay](https://img.shields.io/badge/VNPay-Payment_Gateway-005BAA?style=for-the-badge)

<p align="center">
  <b>Nền tảng thương mại điện tử thời trang thông minh tích hợp trí tuệ nhân tạo (AI), hệ thống phân tích dữ liệu chuyên sâu (Admin Analytics), cổng thanh toán VNPay và trải nghiệm mua sắm mượt mà.</b>
</p>

[✨ Tính Năng](#-tính-năng-nổi-bật) •
[🛠 Công Nghệ](#-công-nghệ-sử-dụng) •
[🏗 Cấu Trúc Dự Án](#-cấu-trúc-thư-mục) •
[🚀 Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt) •
[📊 Quản Trị & Báo Cáo](#-hệ-thống-quản-trị-admin) •
[🔐 Cấu Hình Môi Trường](#-cấu-hình-môi-trường-env)

---

</div>

## 🌟 Tổng Quan Dự Án

**AI-Powered Fashion E-commerce** là giải pháp toàn diện cho ngành bán lẻ thời trang hiện đại. Hệ thống được xây dựng với kiến trúc Client-Server tách biệt, chú trọng tối đa vào trải nghiệm người dùng (UX/UI), tốc độ xử lý, tính bảo mật cao và khả năng mở rộng linh hoạt.

---

## ✨ Tính Năng Nổi Bật

### 🛍 1. Dành Cho Khách Hàng (Customer Experience)
- **Giao diện mua sắm thời thượng:** Thiết kế responsive chuẩn hiện đại, chuyển động mượt mà với Framer Motion và tối ưu giao diện theo tiêu chuẩn thẩm mỹ cao cấp.
- **Bộ lọc & Tìm kiếm thông minh:** Tìm kiếm thời gian thực, lọc theo danh mục (Category), thương hiệu (Brand), khoảng giá, màu sắc, kích cỡ và sắp xếp linh hoạt.
- **Chi tiết sản phẩm đa biến thể (Product Variants):** Quản lý ma trận biến thể (Màu sắc × Size), cập nhật tồn kho tức thì, thư viện ảnh đa góc độ, đánh giá & nhận xét sản phẩm.
- **Giỏ hàng & Wishlist:** Đồng bộ giỏ hàng thời gian thực, lưu trữ sản phẩm yêu thích (Wishlist).
- **Thanh toán tích hợp VNPay & COD:** Hỗ trợ thanh toán cổng VNPAY (sandbox, checksum an toàn, IPN xác thực) và thanh toán khi nhận hàng (COD).
- **Theo dõi đơn hàng & Hồ sơ cá nhân:** Quản lý lịch sử đơn hàng, cập nhật thông tin cá nhân, địa chỉ nhận hàng và theo dõi trạng thái vận chuyển thời gian thực.
- **AI Virtual Try-On (Thử đồ ảo AI):** Khám phá tính năng thử trang phục thông minh tăng tỷ lệ chuyển đổi mua hàng.

---

### 📊 2. Dành Cho Quản Trị Viên (Admin & Management Suite)
- **Analytics & BI Dashboard:**
  - **KPIs Cards:** Doanh thu, số lượng đơn hàng, khách hàng mới, tỷ lệ chuyển đổi.
  - **Biểu đồ trực quan (Recharts):** Xu hướng doanh thu theo thời gian, tỷ trọng doanh số theo danh mục (Category Sales), cơ cấu thanh toán (VNPay vs COD), biểu đồ donut trạng thái đơn hàng.
  - **Bảng tổng hợp:** Top sản phẩm bán chạy nhất, Top khách hàng chi tiêu cao nhất, Widget cảnh báo tồn kho thấp (Low Stock Alert).
- **Quản lý sản phẩm chuyên sâu:**
  - Tạo mới, cập nhật, ẩn/hiện sản phẩm với nhiều biến thể (SKU, giá riêng từng biến thể, số lượng kho).
  - Tích hợp nén ảnh trực tiếp trên trình duyệt (`browser-image-compression`) và tự động tải lên Cloudinary.
- **Quản lý danh mục & thương hiệu:** Cấu trúc phân cấp danh mục, quản lý bộ sưu tập thương hiệu.
- **Quản lý đơn hàng toàn diện:** Cập nhật trạng thái đơn (Chờ xử lý, Đang đóng gói, Đang giao, Đã giao, Đã hủy), xem chi tiết thanh toán giao dịch VNPay.
- **Quản lý người dùng & phân quyền:**
  - Phân quyền người dùng (Admin, Staff, Customer).
  - Khóa / Mở khóa tài khoản, phân loại khách hàng bằng hệ thống Huy hiệu (VIP, Khách hàng thân thiết, Khách hàng mới).
  - Drawer chi tiết lịch sử mua sắm và tổng chi tiêu của từng khách hàng.

---

## 🛠 Công Nghệ Sử Dụng

### 💻 Frontend
| Công nghệ | Mục đích |
| :--- | :--- |
| **React 19** | Thư viện UI cốt lõi |
| **Vite** | Build tool thế hệ mới với tốc độ siêu nhanh |
| **Tailwind CSS v4** | Hệ thống utility-first CSS hiện đại, tối ưu dung lượng |
| **Framer Motion** | Tạo hiệu ứng chuyển động và tương tác mượt mà |
| **Recharts** | Vẽ biểu đồ thống kê, phân tích dữ liệu kinh doanh |
| **Zustand** | Quản lý state toàn cục nhẹ nhàng, hiệu quả |
| **React Hook Form + Zod** | Quản lý và validate form chặt chẽ, an toàn dữ liệu |
| **Lucide React** | Bộ icon vector sắc nét, đồng bộ |
| **Browser Image Compression** | Tối ưu kích thước ảnh trước khi tải lên |

### ⚙️ Backend
| Công nghệ | Mục đích |
| :--- | :--- |
| **Node.js (ES Modules)** | Môi trường runtime phía máy chủ |
| **Express.js** | Framework API RESTful linh hoạt |
| **MongoDB & Mongoose** | Cơ sở dữ liệu NoSQL lưu trữ tài liệu với transaction |
| **JSON Web Token (JWT)** | Xác thực Access Token & Refresh Token an toàn |
| **Cookie-Parser** | Xử lý HTTP-only Cookie chống XSS/CSRF |
| **Cloudinary SDK & Multer** | Lưu trữ và xử lý tối ưu hóa hình ảnh đám mây |
| **VNPay SDK / API Integration** | Tích hợp cổng thanh toán trực tuyến bảo mật chuẩn SHA512 |
| **Socket.io** | Truyền tải dữ liệu thời gian thực |
| **Zod** | Validate schema cho request payload |

---

## 🏗 Cấu Trúc Thư Mục

```text
Fashion E-commerce/
├── backend/
│   ├── scripts/                  # Scripts seed data, migration
│   │   ├── seedMasterData.js     # Master seeder dữ liệu mẫu đầy đủ
│   │   └── migrateOrderStatuses.js
│   ├── src/
│   │   ├── config/               # Cấu hình Database, Cloudinary, VNPay
│   │   ├── controllers/          # Bộ điều khiển xử lý logic nghiệp vụ
│   │   │   ├── adminAnalyticsController.js
│   │   │   ├── adminProductController.js
│   │   │   ├── adminUserController.js
│   │   │   └── ...
│   │   ├── middlewares/          # Middleware xác thực JWT, phân quyền (RBAC)
│   │   ├── models/               # MongoDB Schemas (User, Product, Order, Category, Brand,...)
│   │   ├── routes/               # Khai báo các API Endpoints
│   │   ├── services/             # Lớp tầng nghiệp vụ (Business Logic Layer)
│   │   ├── utils/                # Tiện ích bổ trợ (VNPay, Token, Format)
│   │   ├── server.js             # File khởi động máy chủ Backend
│   │   └── app.js                # Cấu hình Express App
│   ├── test/                     # Bộ test API backend
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components tái sử dụng
│   │   │   ├── admin/            # Components Dashboard, Drawers, Widgets, Charts
│   │   │   │   ├── dashboard/    # Biểu đồ KPI, Sales, Trends, Stock alerts
│   │   │   │   ├── customers/    # Customer Drawer, Badges
│   │   │   │   └── products/     # Product Drawer, Variant manager
│   │   │   ├── common/           # Navbar, Footer, Modal, Button,...
│   │   │   └── shop/             # ProductCard, FilterSidebar, ReviewBox,...
│   │   ├── layouts/              # MainLayout, AdminLayout
│   │   ├── pages/                # Các trang chính
│   │   │   ├── admin/            # Dashboard, ManageProducts, ManageOrders, ManageCustomers,...
│   │   │   ├── auth/             # Login, Register, ForgotPassword
│   │   │   └── shop/             # Home, CatalogPage, ProductDetail, Cart, Checkout, Profile,...
│   │   ├── services/             # API Client (Axios) tương tác với Backend
│   │   ├── store/                # Zustand state stores (authStore, cartStore,...)
│   │   └── utils/                # Helpers, nén ảnh, định dạng tiền tệ
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 📋 Yêu Cầu Hệ Thống
- **Node.js**: Phiên bản `>= 18.x`
- **MongoDB**: Đã cài đặt và đang chạy (hỗ trợ ReplicaSet nếu sử dụng Transaction)
- **Git**

---

### 1️⃣ Clone Dự Án
```bash
git clone https://github.com/cuognit/AI-Powered-Fashion-E-commerce.git
cd "AI-Powered-Fashion-E-commerce"
```

---

### 2️⃣ Cấu Hình & Chạy Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/` (tham khảo mẫu bên dưới):
```env
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/fashion?replicaSet=rs0
JWT_ACCESS_SECRET=your_jwt_access_secret_key_123
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_123
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay/return
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Tạo dữ liệu mẫu (Seed Data) đầy đủ cho hệ thống:
```bash
npm run seed:master
```

Khởi động máy chủ backend ở chế độ dev:
```bash
npm run dev
```
> Backend sẽ chạy tại: **`http://localhost:3000`**

---

### 3️⃣ Cài Đặt & Chạy Frontend

Mở một terminal mới:
```bash
cd frontend
npm install
npm run dev
```
> Frontend sẽ chạy tại: **`http://localhost:5173`**

---

## 🔐 Cấu Hình Môi Trường (.env)

### Backend Environment Variables
| Biến | Ý Nghĩa | Ví Dụ |
| :--- | :--- | :--- |
| `PORT` | Cổng hoạt động của server | `3000` |
| `CLIENT_URL` | URL của ứng dụng Frontend (CORS) | `http://localhost:5173` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB | `mongodb://localhost:27017/fashion?replicaSet=rs0` |
| `JWT_ACCESS_SECRET` | Khóa bí mật ký Access Token | `secret_access_key` |
| `JWT_REFRESH_SECRET` | Khóa bí mật ký Refresh Token | `secret_refresh_key` |
| `VNPAY_TMN_CODE` | Mã website tại hệ thống VNPAY | `VNPAY_SANDBOX_CODE` |
| `VNPAY_HASH_SECRET` | Chuỗi bí mật tạo checksum VNPAY | `VNPAY_HASH_SECRET_KEY` |
| `VNPAY_RETURN_URL` | URL xử lý kết quả thanh toán trả về | `http://localhost:3000/api/payments/vnpay/return` |

---

## 📡 Danh Sách API Chính (API Endpoints)

<details>
<summary><b>🔹 Xem danh sách API Routes chi tiết</b></summary>

### 🔑 Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập hệ thống
- `POST /api/auth/refresh-token` - Làm mới Access Token
- `POST /api/auth/logout` - Đăng xuất & hủy token

### 🛍 Products & Catalog
- `GET /api/products` - Lấy danh sách sản phẩm (có lọc & phân trang)
- `GET /api/products/:slug` - Chi tiết sản phẩm theo slug
- `GET /api/search` - Tìm kiếm sản phẩm
- `GET /api/reviews/:productId` - Danh sách đánh giá sản phẩm

### 🛒 Cart & Orders
- `GET /api/cart` - Lấy thông tin giỏ hàng của user
- `POST /api/cart/items` - Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/items/:itemId` - Cập nhật số lượng
- `DELETE /api/cart/items/:itemId` - Xóa món hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/my-orders` - Lịch sử đơn hàng của người dùng

### 💳 VNPay Payments
- `POST /api/payments/create_payment_url` - Tạo liên kết thanh toán VNPay
- `GET /api/payments/vnpay/return` - Xử lý redirect sau thanh toán
- `GET /api/payments/vnpay/ipn` - Xử lý IPN tức thời từ VNPay

### 👑 Admin Suite (Yêu cầu quyền Admin/Staff)
- `GET /api/admin/analytics/overview` - Lấy số liệu thống kê Dashboard tổng hợp
- `GET /api/admin/products` - Quản lý danh sách sản phẩm
- `POST /api/admin/products` - Thêm mới sản phẩm & biến thể
- `PUT /api/admin/products/:id` - Cập nhật thông tin sản phẩm
- `GET /api/admin/orders` - Danh sách và trạng thái toàn bộ đơn hàng
- `PUT /api/admin/orders/:id/status` - Cập nhật tiến trình đơn hàng
- `GET /api/admin/users` - Danh sách khách hàng và nhân sự
- `PATCH /api/admin/users/:id/status` - Khóa / Kích hoạt tài khoản

</details>

---

## 🧪 Testing & Code Quality

Để chạy bộ kiểm thử tự động của Backend:
```bash
cd backend
npm test
```

---

## 👨‍💻 Tác Giả & Đóng Góp

- **Author:** [cuognit](https://github.com/cuognit)
- **Email:** [cuongct18.jr@gmail.com](mailto:cuongct18.jr@gmail.com)
- **Repository:** [AI-Powered-Fashion-E-commerce](https://github.com/cuognit/AI-Powered-Fashion-E-commerce)

---

<div align="center">
  <p>Được phát triển với ❤️ và niềm đam mê công nghệ hiện đại.</p>
</div>
