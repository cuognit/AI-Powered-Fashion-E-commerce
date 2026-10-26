# Address Book — bước 5–8

## Phạm vi kiểm thử

- `addressBook.test.js`: Mongoose validation trong bộ nhớ, không save vào MongoDB.
- `addressValidation.test.js`: Zod, đối chiếu frontend/Checkout và middleware body.
- `addressService.test.js`: service thật với findOne/save stub; save stub chạy model.validate().
- `addressApi.test.js`: Express router, JWT và Zod thật; User/AddressBook dùng stub, không mở HTTP socket.
- `addressMutations.test.js`: PATCH/DELETE/default, thứ tự chọn lại mặc định, quyền sở hữu và các nhánh VersionError.
- `addressHttp.test.js`: HTTP thật trên `127.0.0.1` và cổng ngẫu nhiên; Express JSON parser, Address Router, JWT, Zod, Service và Error Handler thật; User/AddressBook vẫn là stub. Không dùng `server.js`, không chạy job, không kết nối MongoDB.
- `addressIsolation.test.js`: regression bằng stub cho sự độc lập với User/Order/Cart, kiểu chuỗi `User.address`, Profile và GET Cart.
- Các test cạnh tranh ghi mô phỏng duplicate key/VersionError, KHÔNG chứng minh hành vi MongoDB.

Chạy từ backend:

```powershell
node --test --test-concurrency=1 test/addressBook.test.js test/addressValidation.test.js test/addressService.test.js test/addressApi.test.js test/addressMutations.test.js test/addressIsolation.test.js
node --test test/addressHttp.test.js
```

## Index và sổ mới

Model giữ khai báo unique user_id, nhưng đặt autoCreate/autoIndex=false để không tự thay đổi collection/index đang có. Không gọi init(), createIndexes() hoặc syncIndexes().

Sổ mới do service tạo dùng _id bằng ID user. Collection MongoDB thông thường có unique index _id: hai request cùng tạo sẽ cùng dùng khóa này và một lần insert phải thất bại. Sổ cũ tìm qua user_id được giữ nguyên _id. Đây không phải migration và không sửa các document cũ.

Unique user_id vẫn cần được quản trị kiểm tra và triển khai có chủ đích để bảo vệ các lần ghi ngoài module; không giả định index đó đã có. Dữ liệu trùng do nguồn ngoài tạo trước đó không được tự sửa hoặc xóa.

## Integration test cần làm trên database test riêng

Chưa có database test an toàn được chỉ định nên không thực hiện kết nối hoặc thay đổi index. Khi đã có database thử nghiệm dùng riêng, cần:

1. Xác nhận URI/database test không trỏ tới database phát triển dùng chung hoặc production; không in URI/token ra log.
2. Kiểm tra index thực tế bằng listIndexes, bao gồm _id và user_id. Chỉ tạo index trong database test được cấp phép; không syncIndexes lên database hiện tại.
3. Dùng app.js hoặc Express harness riêng trong test, không chạy server.js vì có job thanh toán định kỳ. HTTP harness hiện tại chỉ mount Address Router; việc này không thay thế nghiệm thu toàn bộ app trên cấu hình triển khai thật.
4. Kiểm tra JWT với User test A/B, GET rỗng không tạo document, POST đầu/tiếp theo và GET mới sau POST (hoặc F5).
5. Gửi hai POST đồng thời khi chưa có sổ, khi có sổ và khi có 19 địa chỉ. Xác nhận một sổ/user, không mất dữ liệu âm thầm, tối đa 20 và một mặc định thuộc danh sách. Request thất bại trả 409, không tự retry POST.
6. Kiểm tra __v, timestamps và VersionError thật qua save(). Chỉ dọn dữ liệu test đã tạo trong database test được cấp phép.
7. Kiểm tra PATCH một trường không xóa các trường bỏ qua; POST/PATCH/DELETE/default của A không được chạm địa chỉ của B. ID sai trả 400, ID đúng định dạng nhưng không thuộc sổ trả 404.
8. Kiểm tra xóa thường, xóa mặc định, xóa cuối. Khi chọn lại mặc định, so createdAt trước rồi _id; nếu dữ liệu cũ thiếu createdAt, service dùng mốc 0 và phân định bằng _id. Không tự sửa timestamps dữ liệu cũ.
9. Kiểm tra đồng thời sửa/sửa, xóa/sửa, mặc định/mặc định, xóa mặc định/đặt mặc định. Một request có thể trả 409; luôn GET đối chiếu trước lần thực hiện tiếp, không tự retry mutation.
10. Trên trình duyệt: sửa A → B → thêm mới; form lỗi giữ bản nháp; Hủy xóa không gọi API; xác nhận mới DELETE; lỗi 404/409 có nút tải lại ngay trong dialog. Native dialog cần được kiểm chứng Tab/Shift+Tab, Escape (chỉ hủy khi chưa gửi), focus ban đầu ở Hủy và trả focus khi đóng, cùng viewport 375px.

Không có bước nào trong các unit test hiện tại kết nối, seed, tạo index hoặc xóa collection thật.

## Bước 7: vòng đời request và phục hồi lỗi

Chạy từ frontend (không cần Backend hoặc MongoDB):

```powershell
node --test test/addressValidation.test.js test/addressForm.test.js test/addressRequests.test.js test/addressApi.test.js test/addressPageState.test.js test/addressErrors.test.js
npm run build
```

- Axios adapter stub kiểm tra đủ năm method/endpoint và deadline toàn Promise. Giữ ngân sách 15 giây của Address Book, bao gồm thời gian chờ interceptor/refresh; không sửa axiosClient hoặc Authentication. Test dùng deadline ngắn hơn và adapter cố tình không tự timeout để chứng minh yêu cầu treo vẫn kết thúc.
- Test hook dùng lifecycle/setter giả, thực thi logic hook thật; test form/trang thực thi handler/biểu thức từ source. Đây không phải kiểm thử DOM, native focus hoặc trình duyệt.
- GET cũ, cleanup, đổi tài khoản, double submit và lỗi mutation được kiểm tra bằng Promise điều khiển được. Timer, signal listener được dọn cả khi thành công, timeout và cancellation.
- Timeout/mất mạng/cancellation sau khi bắt đầu mutation không chứng minh thao tác chưa ghi. Giữ bản nháp, khóa ghi và yêu cầu GET đối chiếu; không tự gửi lại mutation. Signal đã abort trước lời gọi khác với trường hợp này: không gọi transport.
- Sau GET đối chiếu, nếu cùng ID có nội dung mới, form cũ giữ nguyên nhưng không được Lưu. Người dùng phải Hủy hoặc chọn **Dùng bản mới (bỏ bản nháp)**. Nếu ID biến mất, phải Hủy; không tiếp tục lưu ID cũ. Xác nhận xóa giữ snapshot cũ; nếu nội dung/trạng thái mặc định thay đổi thì phải Hủy và mở lại.
- Rời trang sẽ bỏ bản nháp thuộc trang đó. Khi quay lại phải GET mới; abort phía client không hoàn tác việc ghi của server.

Nghiệm thu bằng Chrome DevTools chỉ khi có môi trường thử nghiệm riêng an toàn:

1. Network → lọc `addresses`, dùng throttling để quan sát loading, disabled và một request ghi cho nhiều lần bấm. Không sao chép/chia sẻ token, cookie hoặc HAR có dữ liệu cá nhân.
2. Thử GET bị chặn/offline → thông báo lỗi → bật mạng → Thử lại. Request không phản hồi phải kết thúc chờ sau khoảng 15 giây.
3. Với mutation bị mất phản hồi, kiểm tra bản nháp còn nguyên và không có lần ghi tự động tiếp theo; bật mạng và GET đối chiếu trước khi quyết định gửi lại. Offline trước khi gửi không mô phỏng đầy đủ việc server đã ghi nhưng response bị mất.
4. Trong môi trường test, thay đổi/xóa địa chỉ từ phiên khác rồi tải lại: bản nháp phải được giữ, đồng thời chặn ghi bản cũ khi đã thấy dữ liệu thay đổi. Đổi A → B hoặc rời trang trong lúc request chờ không được đưa response A vào giao diện B.
5. Kiểm tra 375px, Tab/Shift+Tab/Enter/Escape, focus vào Hủy khi mở dialog và trả focus khi đóng. Những hành vi trình duyệt này chưa được chứng minh bằng unit test.

Database integration, unique index và xung đột save thật vẫn chờ database test riêng như danh sách phía trên.

## Điều kiện cấu hình MongoDB test trước lần chạy có ghi

Hiện `src/config/database.js` chỉ đọc `MONGODB_URI`, không đổi database theo `NODE_ENV`. `.env` và `.env.example` chưa có cấu hình test độc lập. Không suy ra một URI an toàn chỉ vì tên biến chứa `TEST`.

Chưa có MongoDB test được xác nhận và chưa có phép ghi nên bước 8 KHÔNG chạy phần này. Các bước dưới là hướng dẫn cho lần kiểm thử tiếp theo, chưa phải runner đã được triển khai:

1. Chuẩn bị MongoDB instance riêng hoặc database riêng được xác nhận độc lập, cùng tài khoản chỉ có quyền trên database đó. Không dùng URI hiện tại làm fallback. Xác nhận host/instance, database và phạm vi quyền với chủ môi trường; không đưa URI có mật khẩu vào Git/chat/log.
2. Dành tên database cho từng lần chạy, ví dụ `address_book_test_<runId>`. Test runner tương lai phải nhận URI/name test rõ ràng, từ chối khi thiếu cấu hình hoặc trùng đích development/production và chỉ kết nối sau khi người dùng cho phép. `NODE_ENV=test` hoặc một cờ xác nhận riêng lẻ không chứng minh database an toàn.
3. Cấp cấu hình bằng biến môi trường của phiên test hoặc cơ chế quản lý bí mật. Nếu đề xuất `MONGODB_TEST_URI` và `ADDRESS_BOOK_TEST_DB`, cần nhớ code kết nối hiện tại chưa tự đọc hai biến này. Không thêm URI test vào `.env` dùng chung; tên file env tùy ý cũng chưa chắc đã được Git ignore.
4. Runner dùng kết nối test với `autoCreate: false`, `autoIndex: false`. Kiểm tra tên database đã chọn trước thao tác ghi; không gọi `syncIndexes()`. Chỉ chuẩn bị collection/index trên database riêng sau khi có quyền rõ ràng.
5. Kiểm tra index bằng `listIndexes()` trên `address_books`. Unique `_id` có vai trò khác unique `user_id`: Service dùng `_id=userId` cho sổ mới, nhưng sổ cũ hoặc tác nhân ghi ngoài Service vẫn cần unique `user_id`. Khai báo schema chưa chứng minh index này đã tồn tại.
6. Tạo tài khoản A/B tổng hợp với ObjectId mới và email dưới domain `.test`. Ghi lại manifest ID của User/AddressBook do test tạo. Cleanup chỉ được xóa theo đúng các ID đó trong database đã xác nhận; không dùng `dropDatabase`, `dropCollection` hoặc `deleteMany({})`. Giữ dữ liệu khi cần điều tra thất bại, theo chính sách của môi trường test.
7. Sau khi được phép, chạy persistence/reconnect, timestamps, uniqueness, VersionError thật và HTTP + MongoDB theo checklist ở trên. Dùng hai bản document đọc trước lần save đầu để kiểm tra concurrency thực; mock VersionError không thay thế bước này.

Kết quả nghiệm thu lần hiện tại và checklist còn mở: [ADDRESS_BOOK_ACCEPTANCE.md](ADDRESS_BOOK_ACCEPTANCE.md).
