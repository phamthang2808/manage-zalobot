# Hướng dẫn Bảo mật và Cấu hình Google Apps Script (Thư viện & Web App)

Tài liệu này hướng dẫn chi tiết cách thiết lập dự án Google Sheets đối soát để **khách hàng có thể sử dụng bình thường nhưng KHÔNG THỂ xem hoặc copy được mã nguồn gốc (code)** bằng phương pháp sử dụng **Thư viện (Library)**.

---

## PHẦN 1: THIẾT LẬP BAN ĐẦU (Chỉ làm 1 lần duy nhất cho mỗi khách hàng mới)

### Bước 1.1: Tạo dự án Code gốc trên Gmail chính
*(Dự án này nằm độc lập trên Google Drive của Gmail chính, không gắn với bất kỳ file Google Sheets nào)*

1. Truy cập vào trang quản lý: **[script.google.com](https://script.google.com)** bằng Gmail chính của bạn.
2. Bấm chọn nút **Dự án mới (New project)** ở góc trên bên trái.
3. Dán toàn bộ mã nguồn xử lý vào file `Code.gs` và tạo file `Index.html` dán giao diện web vào. Bấm **Lưu (Save - biểu tượng đĩa mềm)**.
4. **Chia sẻ quyền chạy code cho khách** *(Giúp tài khoản khách chạy được code nhưng bị ẩn không xem được chi tiết)*:
   * Bấm nút **Chia sẻ (Share)** ở góc trên bên phải màn hình.
   * Nhập Gmail của khách hàng vào.
   * Chọn quyền là **Người xem (Viewer)**.
   * Bấm **Lưu (Save)**.
5. **Lấy Script ID (Mã dự án)**:
   * Bấm vào biểu tượng **Cài đặt dự án (Project Settings)** (hình bánh răng ở danh sách bên trái).
   * Sao chép dòng **Mã dự án (Script ID)** (dòng mã dài gồm chữ và số).
6. **Xuất bản Thư viện**:
   * Bấm nút **Triển khai (Deploy)** ở góc trên bên phải $\rightarrow$ Chọn **Triển khai mới (New deployment)**.
   * Bấm biểu tượng bánh răng ở góc trái hộp thoại $\rightarrow$ Chọn **Thư viện (Library)**.
   * Điền mô tả ngắn (ví dụ: `v1`) $\rightarrow$ Bấm **Triển khai (Deploy)**. *(Hành động này tạo ra Phiên bản số 1)*.

---

### Bước 1.2: Liên kết thư viện vào Google Sheet của khách
1. Mở file Google Sheet của khách lên $\rightarrow$ Vào **Tiện ích mở rộng (Extensions)** $\rightarrow$ **Apps Script**.
2. Nhìn danh sách bên trái, tại mục **Thư viện (Libraries)**, bấm vào dấu **`+`**.
3. Dán **Script ID** (đã copy ở Bước 1.1) vào ô tìm kiếm $\rightarrow$ Bấm nút **Tìm kiếm (Look up)**.
4. Hệ thống sẽ nhận diện ra thư viện của bạn. Cấu hình như sau:
   * **Phiên bản (Version)**: Chọn số **`1`** (hoặc chọn *Developer mode*).
   * **Mã định danh (Identifier)**: Đặt tên gợi nhớ viết liền không dấu là **`ThuVienDoiSoat`**.
5. Bấm nút **Thêm (Add)** ở góc dưới.
6. Xóa sạch mọi code mặc định trong file `Code.gs` của khách và dán đúng đoạn code gọi thư viện dưới đây (để hệ thống chuyển tiếp được các yêu cầu từ Web App sang thư viện):
   ```javascript
   // Hứng yêu cầu truy cập và mở trang Web đối soát
   function doGet(e) {
     return ThuVienDoiSoat.doGet(e);
   }

   // Tự động tạo menu khi mở Sheet
   function onOpen() {
     ThuVienDoiSoat.onOpen();
   }

   // Hàm chạy đồng bộ đơn hàng từ menu
   function syncShopeeOrders() {
     ThuVienDoiSoat.syncShopeeOrders();
   }

   // --- CÁC HÀM CHUYỂN TIẾP CHO WEB APP (BẮT BUỘC) ---
   function getDashboardData(password) {
     return ThuVienDoiSoat.getDashboardData(password);
   }

   function markUserAsPaid(password, zaloName) {
     return ThuVienDoiSoat.markUserAsPaid(password, zaloName);
   }

   // Thanh toán đơn lẻ
   function markSingleOrderAsPaid(password, rowNumber) {
     return ThuVienDoiSoat.markSingleOrderAsPaid(password, rowNumber);
   }
   ```
7. Bấm **Lưu (Save)**.

---


### Bước 1.3: Triển khai Web App để lấy link gửi cho khách
*(Thực hiện thao tác này ngay trên Apps Script của file Google Sheet khách ở Bước 1.2)*

1. Bấm **Triển khai (Deploy)** ở góc phải $\rightarrow$ Chọn **Triển khai mới (New deployment)**.
2. Bấm bánh răng $\rightarrow$ Chọn **Ứng dụng web (Web app)**.
3. Thiết lập thông số:
   * **Thực thi dưới dạng (Execute as)**: Chọn **Tôi (thangcutehuhu2808@gmail.com)**.
   * **Ai có quyền truy cập (Who has access)**: Chọn **Bất kỳ ai (Anyone)**.
4. Bấm **Triển khai (Deploy)** (và xác thực cấp quyền Gmail nếu được hỏi).
5. Sao chép lấy đường link **URL ứng dụng web (Web app URL)** được cấp:
   * Gửi link này cho khách truy cập trang đối soát (Mật khẩu đăng nhập mặc định của bạn đặt là `phamthang2808`).
   * Dán link này vào mục `googleWebAppUrl` của khách hàng tương ứng trong file `bots-config.json` dưới máy tính và chạy file `deploy-bots-config.bat` để cập nhật lên VPS.

---

## PHẦN 2: QUY TRÌNH CẬP NHẬT CODE (Khi bạn nâng cấp tính năng hoặc sửa giao diện web)
*Khi cập nhật code mới, đường link Web App của khách hàng **giữ nguyên không đổi**, không cần sửa file cấu hình dưới máy tính.*

### Bước 2.1: Đóng gói bản cập nhật mới trên Gmail chính (`ThuVienDoiSoat`)
1. Mở dự án code gốc **`ThuVienDoiSoat`** trên Gmail chính lên.
2. Tiến hành sửa code mới ở `Code.gs` hoặc `Index.html` $\rightarrow$ Bấm **Lưu**.
3. Bấm **Triển khai (Deploy)** $\rightarrow$ chọn **Quản lý các bản triển khai (Manage deployments)**.
4. Chọn bản triển khai dạng **Thư viện (Library)** trong danh sách $\rightarrow$ Bấm nút **Chỉnh sửa (Hình cây bút chì)**.
5. Tại dòng **Phiên bản (Version)**, bấm chọn **Phiên bản mới (New version)**.
6. Bấm **Triển khai (Deploy)**. *(Google sẽ đóng gói thành phiên bản số tiếp theo, ví dụ phiên bản số 2)*.

### Bước 2.2: Cập nhật phiên bản trên Google Sheet của khách để nhận code mới
*(Lưu ý: Nếu lúc thêm thư viện ở phần 1 anh chọn phiên bản là **Developer mode**, anh có thể bỏ qua hoàn toàn Bước 2.2 này vì code sẽ tự cập nhật ngay lập tức)*

1. Mở Apps Script trên Google Sheet của khách lên.
2. Click vào tên thư viện **`ThuVienDoiSoat`** ở danh sách bên trái.
3. Tại ô **Phiên bản (Version)**, bấm chọn số phiên bản mới nhất vừa tạo ở Bước 2.1 (ví dụ chọn số **`2`**).
4. Bấm **Lưu (Save)**.

---

## PHẦN 3: CÁC LỖI THƯỜNG GẶP & CÁCH KHẮC PHỤC (TROUBLESHOOTING)

### 3.1. Lỗi `NOT_FOUND` khi bấm menu "Đồng bộ đơn hàng Shopee"
* **Hiện tượng**: Khi click nút Đồng bộ đơn hàng trên file Excel, hệ thống báo lỗi *"máy chủ đã gặp phải lỗi trong quá trình đọc từ bộ nhớ. Mã lỗi NOT_FOUND"*.
* **Nguyên nhân**: Google Sheet của khách chưa kịp nạp/cập nhật lại các thiết lập liên kết thư viện mới ở Apps Script.
* **Cách khắc phục**:
  1. Trong Apps Script của Google Sheet khách, kiểm tra xem biểu tượng **Đĩa mềm (Lưu dự án)** đã được bấm lưu chưa (nút phải mờ đi).
  2. Quay lại file Google Sheet (Excel), bấm **F5 (Reload)** để tải lại toàn bộ trang web.
  3. Chờ 5 giây cho menu xuất hiện lại rồi bấm chạy lại. Khi hệ thống yêu cầu cấp quyền chạy script (Xác thực tài khoản), chọn **Tiếp tục** $\rightarrow$ chọn tài khoản Gmail $\rightarrow$ bấm **Cho phép (Allow)**.

### 3.2. Lỗi `TypeError: Cannot read properties of undefined (reading 'parameter')`
* **Hiện tượng**: Báo lỗi này khi chạy thử hàm `doGet` trực tiếp từ trình soạn thảo Apps Script.
* **Nguyên nhân**: Hàm `doGet(e)` cần nhận dữ liệu yêu cầu thực tế từ trình duyệt web truyền vào biến `e`. Khi chạy thủ công bằng nút "Chạy" trong trình soạn thảo, biến `e` bị trống (`undefined`).
* **Cách khắc phục**: Đây không phải là lỗi code. Bạn chỉ cần lấy link Web App đã triển khai và truy cập trực tiếp từ thanh địa chỉ trình duyệt, web sẽ mở bình thường.

### 3.3. Bị kẹt ở nút "ĐANG XÁC THỰC..." khi đăng nhập Web App
* **Hiện tượng**: Khi vào trang đối soát Web App và điền mật khẩu đăng nhập, nút bấm hiển thị *"ĐANG XÁC THỰC..."* và bị treo ở đó mãi không vào được giao diện bên trong.
* **Nguyên nhân**: Ở file code bên phía **Google Sheet của khách**, bạn chưa viết các hàm "chuyển tiếp" để định tuyến yêu cầu từ giao diện web sang Thư viện chính (do Google Apps Script không cho phép giao diện web tự ý gọi trực tiếp các hàm nằm sâu trong thư viện).
* **Cách khắc phục**:
  1. Mở Apps Script bên phía **Google Sheet của khách**.
  2. Bổ sung các hàm chuyển tiếp (giống như ở **Bước 1.2**) vào cuối file `Code.gs` của khách:
     ```javascript
     function getDashboardData(password) {
       return ThuVienDoiSoat.getDashboardData(password);
     }
     function markUserAsPaid(password, zaloName) {
       return ThuVienDoiSoat.markUserAsPaid(password, zaloName);
     }
     function markSingleOrderAsPaid(password, rowNumber) {
       return ThuVienDoiSoat.markSingleOrderAsPaid(password, rowNumber);
     }
     ```
  3. Bấm **Lưu dự án (Đĩa mềm)**. Quay lại trang đối soát Web App, F5 tải lại trang và tiến hành đăng nhập lại.


