# Address Book — nghiệm thu bước 8

Ngày đánh giá: 26/10/2026. Kết luận: **Đạt kiểm thử tự động nhưng còn điều kiện nghiệm thu**.

Chưa có database test độc lập được xác nhận và chưa có phép ghi MongoDB. Không có kiểm thử MongoDB thật trong báo cáo này. Không sửa code runtime, Authentication, Checkout, User/Order Model hoặc Product Comparison.

## A. Kiểm thử tự động đã đạt

| Nhóm | Số test | Loại bằng chứng |
| --- | ---: | --- |
| Backend Address Model/Validation/Service/Router hiện có | 70 | Validation thật trong bộ nhớ; query/save stub; Router dispatch trong bộ nhớ |
| Address isolation mới | 2 | Guard các phương thức ghi User/Order/Cart; Profile và GET Cart với stub |
| HTTP mới | 5 | TCP loopback thật, JSON parser, Router, JWT, Zod, Service và Error Handler thật; storage/User stub |
| Backend regression: adminUser, bruteForce, wishlist, order, vnpay | 38 | Test hiện có với stub hoặc hàm thuần; gồm auth vô hiệu hóa tài khoản, refresh và Checkout validation |
| Frontend Address Book | 75 | RHF/Zod thật; Axios adapter stub; hook/handler với lifecycle/setter giả |
| Frontend Product Comparison | 49 | Store/persistence/request/utils; storage và network giả |
| **Tổng số trường hợp khác nhau ở các lần chạy đạt cuối** | **239** | Không cộng lại các lần rerun; không phải 239 integration test MongoDB |

Backend không có HTTP được chạy thành một nhóm 110/110. HTTP chạy riêng 5/5. Frontend Address Book chạy riêng 75/75, Comparison riêng 49/49; dùng `--test-concurrency=1` cho các nhóm hồi quy.

Ngoài số test node:test: smoke check với GET adapter treo ở deadline mặc định 15000ms đã kết thúc sau khoảng **15004ms**, trả `ECONNABORTED`, abort transport và chỉ gọi một lần. Không có HTTP/MongoDB trong smoke check này.

Frontend build đạt; còn cảnh báo chunk >500kB. `node --check` đạt cho 23 file JavaScript Address Book; JSX được kiểm tra qua Vite build. Whitespace được kiểm tra cho diff và các file test/tài liệu mới.

HTTP mới xác minh đủ năm endpoint, status 200/201/400/401/404/409/500, hợp đồng JSON không có user_id/__v/stack, JWT thiếu/sai/hết hạn/sai loại, query/body không thay chủ sở hữu, tài khoản B không truy cập tài nguyên của A. HTTP 403 được kiểm tra ở tầng thông báo Frontend; không tạo quyền 403 mới ở Backend.

HTTP harness không import `app.js`/`server.js`, chỉ mount Address Router ở `/api/addresses` cùng parser/error handler. Nó không kiểm tra deployment proxy/CORS/cookie/refresh end-to-end hoặc toàn bộ app routes.

## B. MongoDB integration

**Chưa chạy.** Không có kết nối, seed, migration, tạo/xóa index hoặc xóa collection thật. Mongoose validation trong bộ nhớ và stub VersionError không chứng minh MongoDB vận hành đúng.

Chưa xác minh: persistence sau reconnect, timestamps lúc save thật, index thực tế, uniqueness, concurrency và HTTP + MongoDB. Hướng dẫn chuẩn bị/cleanup an toàn nằm trong [ADDRESS_BOOK_TESTING.md](ADDRESS_BOOK_TESTING.md).

## C. Browser acceptance

**Chưa nghiệm thu.** Đã thử truy cập `/profile/addresses` bằng trình duyệt công cụ trên Frontend loopback, nhưng trình duyệt trả `ERR_CONNECTION_TIMED_OUT`. Frontend thử nghiệm được trỏ API tới cổng không hoạt động để tránh truy cập Backend/database hiện tại và đã được dừng sau lần thử.

Không ghi nhận responsive, native dialog, focus, bàn phím, thao tác người dùng hoặc F5 persistence là đã đạt. Node handler tests và Vite build không thay thế browser acceptance.

## D. Xác minh qua đọc source

- Collection là `address_books`; autoCreate/autoIndex tắt; optimisticConcurrency bật.
- Service chỉ chọn chủ sở hữu qua JWT `request.user.sub`; camelCase response được whitelist; không ghi User.address/Order/Cart.
- User.address vẫn là String; Order giữ shipping_address như trước. Checkout tiếp tục luồng shippingDetails/updateProfile hiện có, không import Address Book.
- AuthContext và axiosClient giữ cơ chế token/refresh cũ. Address Book key theo user.id; abort + sequence bảo vệ response cũ và cleanup. Đây không phải nghiệm thu session/cookie trên trình duyệt.
- `/profile/addresses` nằm dưới PrivateRoute. Profile/UserDropdown có liên kết. `/compare`, `/cart`, `/checkout` giữ route cũ; Backend `/addresses` có mount riêng, không thấy xung đột tĩnh với route khác. `/api/v1` alias được nhìn thấy trong app.js, chưa được HTTP harness này kiểm tra.
- database.js đọc MONGODB_URI, chưa có cơ chế bảo vệ test DB riêng. app.js không trực tiếp connect DB/chạy job; server.js connect DB và chạy job thanh toán mỗi 60 giây. Không chạy server.js.

Giới hạn kiến trúc cần hiểu: optimisticConcurrency bảo vệ khoảng đọc document → save trong một request Backend. API hiện chưa nhận version/If-Match từ lúc người dùng mở form; việc phát hiện bản nháp cũ trên Frontend dựa vào GET đối chiếu. Vì vậy chưa thể diễn giải cơ chế hiện tại là bảo vệ mọi chỉnh sửa của một form mở lâu mà chưa refresh. Đây là giới hạn xác định qua source, không phải lỗi MongoDB đã tái hiện; bước 8 không tự mở rộng hợp đồng API.

## Lỗi và bất thường ghi nhận

Không tái hiện lỗi chức năng Address Book trong phạm vi kiểm thử đã chạy; không có bản sửa runtime ở bước 8. Điều này không khẳng định các phần B/C đã đạt.

| Hiện tượng | Mức độ/phạm vi | Bằng chứng và xử lý |
| --- | --- | --- |
| Test Comparison tải A/B thất bại trong lần chạy song song | Rủi ro độ ổn định test hồi quy, chưa kết luận lỗi sản phẩm | Test `hai API thành công: giữ thứ tự selectedIds dù B trả trước A` chỉ nhận B; fixture dùng deadline 25ms và `setImmediate`. Chạy riêng theo thứ tự đạt 49/49. Có dấu hiệu nhạy thời gian khi tải máy tăng; chưa chứng minh nguyên nhân dứt điểm. Không sửa Comparison. |
| HTTP loopback bị EACCES trong sandbox | Hạn chế môi trường | Rerun cùng HTTP test ngoài sandbox sau khi được cho phép đạt 5/5; storage vẫn stub. |
| Browser không mở được loopback | Chặn nghiệm thu UI | ERR_CONNECTION_TIMED_OUT; giữ toàn bộ checklist Browser ở trạng thái chưa xác minh. |

## Checklist còn mở để nghiệm thu cuối

Chỉ chạy các mục có ghi sau khi có database test riêng được xác nhận và được người dùng cho phép.

- [ ] Xác nhận instance/database/account test độc lập, quyền hạn và manifest dữ liệu test; không dùng fallback development/production.
- [ ] Kiểm tra index thật của address_books: unique _id và unique user_id; không suy ra từ schema.
- [ ] Tạo/đọc/sửa/đặt mặc định/xóa rồi đọc lại và reconnect. Kiểm tra timestamps, _id=userId cho sổ mới, giới hạn 20; tại 20 vẫn sửa/xóa được.
- [ ] Kiểm tra chọn lại mặc định theo createdAt rồi _id; xóa cuối mặc định null và giữ document rỗng.
- [ ] Hai bản document đọc cùng phiên bản: save thứ nhất đạt, thứ hai VersionError; HTTP trả 409, dữ liệu không bị ghi đè âm thầm. Thử create/create, edit/edit, delete/edit, default/default, delete/default và thêm khi có 19 địa chỉ.
- [ ] HTTP + MongoDB với A/B: thiếu/sai/hết hạn token bị từ chối; B không thấy/sửa/xóa/đặt mặc định địa chỉ A; body/query không thay chủ sở hữu; không lộ dữ liệu riêng.
- [ ] Trình duyệt trên 375px, 768px, desktop: danh sách, empty, loading, lỗi GET và retry; nội dung dài không tràn.
- [ ] Thêm/sửa: validation dưới input, chỉ PATCH trường thay đổi, Hủy không gửi ghi, thành công mới đóng form; lỗi giữ bản nháp; F5 giữ dữ liệu đã lưu thật.
- [ ] Xóa: Hủy không DELETE, xác nhận mới DELETE, badge/empty đúng; Tab/Shift+Tab/Enter/Escape, focus đầu ở Hủy và trả focus khi đóng. Escape không đóng trong lúc đang ghi.
- [ ] Lỗi 400/401/403/404/409/500, offline, timeout, mất response; mutation không tự retry; GET đối chiếu trước khi thực hiện tiếp. Offline trước lúc gửi chưa mô phỏng server đã commit rồi mất response.
- [ ] Sau refresh thấy cùng ID đổi nội dung: giữ bản nháp nhưng khóa Lưu, chỉ reset khi chủ động chọn bản mới. Địa chỉ biến mất không tiếp tục PATCH ID cũ. Dialog xóa đổi dữ liệu/mặc định phải mở lại.
- [ ] Đổi A → B, rời trang khi GET/mutation đang chạy, GET cũ đến muộn và bấm liên tiếp: không lộ dữ liệu cũ hoặc gửi lặp. Abort phía client không hoàn tác save.
- [ ] Smoke test đăng nhập/refresh, Profile, Cart, Wishlist, Checkout, Order và Comparison trên trình duyệt; Address Book không đồng bộ Checkout.

## Lệnh tái hiện các nhóm không cần MongoDB

Từ backend:

```powershell
node --test --test-concurrency=1 test/addressBook.test.js test/addressValidation.test.js test/addressService.test.js test/addressApi.test.js test/addressMutations.test.js test/addressIsolation.test.js test/adminUser.test.js test/bruteForce.test.js test/wishlist.test.js test/order.test.js test/vnpay.test.js
node --test test/addressHttp.test.js
```

HTTP test cần môi trường cho phép mở/kết nối loopback; không cần MongoDB. Nếu môi trường chặn, ghi nhận blocked thay vì đổi test thành mock transport rồi coi là HTTP đã đạt.

Từ frontend:

```powershell
node --test --test-concurrency=1 test/addressValidation.test.js test/addressForm.test.js test/addressRequests.test.js test/addressApi.test.js test/addressPageState.test.js test/addressErrors.test.js
node --test --test-concurrency=1 test/comparisonPersist.test.js test/comparisonRequests.test.js test/comparisonStore.test.js test/comparisonUtils.test.js
npm run build
```
