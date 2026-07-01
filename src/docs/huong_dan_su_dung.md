# Hướng Dẫn Sử Dụng Hệ Thống Đối Soát Doanh Thu & Hoa Hồng Zalo Bot

Chào mừng bạn đến với hệ thống quản lý đối soát đơn hàng tự động. Tài liệu này hướng dẫn bạn cách quản lý 3 trang tính (sheets) trong file Google Sheets và cách thực hiện đối soát, thanh toán hoa hồng cho các thành viên trên trang quản trị Web App.

---

## PHẦN 1: TỔNG QUAN VỀ 3 TRANG TÍNH (GOOGLE SHEETS)

Bảng tính đối soát của bạn gồm có **3 trang tính (sheets)** với các vai trò cụ thể như sau:

### 1. Sheet `BaoCaoDonHang` (Báo cáo đơn hàng tổng hợp)
Đây là nơi lưu trữ toàn bộ các đơn hàng đã được đồng bộ chính thức.
* **Đặc điểm**: Dữ liệu tại đây được điền tự động khi bạn bấm nút đồng bộ.
* **Các cột thông tin chính**:
  * `Tên Zalo`: Tên có dấu gốc của khách hàng được dịch tự động từ mã liên kết.
  * `Khách Nhận`: Số tiền hoa hồng thực tế sẽ trả cho khách.
  * `Thanh Toán`: Trạng thái thanh toán (hiển thị `CHƯA TRẢ` hoặc `ĐÃ TRẢ`).
  * `Ngày Thanh Toán`: Ngày giờ admin bấm nút thanh toán đơn hàng.

---

### 2. Sheet `ImportRaw` (Dữ liệu thô từ Shopee)
Đây là nơi bạn dán file báo cáo Excel tải từ trang đối soát Shopee Affiliate về để hệ thống quét.
* **Cách sử dụng**: 
  1. Tải báo cáo đơn hàng dạng Excel từ trang đối soát Shopee Affiliate.
  2. Mở file Excel vừa tải, copy toàn bộ nội dung (bao gồm cả dòng tiêu đề đầu tiên).
  3. Dán đè (Paste) toàn bộ vào ô **A1** của sheet `ImportRaw` này.
  4. Bấm menu **`⚙️ Hệ Thống Đối Soát`** $\rightarrow$ chọn **`📥 Đồng bộ đơn hàng Shopee`** để hệ thống tự lọc đơn mới đưa sang sheet `BaoCaoDonHang`.

---

### 3. Sheet `ThanhVien` (Danh sách thành viên & Tài khoản ngân hàng)
Đây là nơi lưu trữ thông tin cá nhân và tài khoản nhận tiền của từng thành viên.
* **Cơ chế tự động**: Khi thành viên nhắn tin/gửi link qua Zalo Bot lần đầu, Bot sẽ tự động đăng ký tên thành viên vào sheet này và tự động điền cột `Zalo ID`.
* **Nhập bằng tay (Nhập thủ công)**: Bạn cần **chủ động nhập tay** các cột thông tin tài khoản ngân hàng của thành viên khi họ cung cấp:
  * `Số Tài Khoản`: Nhập số tài khoản ngân hàng của thành viên.
  * `Ngân Hàng`: Nhập tên ngân hàng (ví dụ: Vietcombank, MBBank...).
  * `Chủ Tài Khoản`: Nhập họ tên chủ tài khoản viết hoa không dấu.
* *Lưu ý*: Các thông tin nhập tay này sẽ tự động hiển thị trên giao diện trang Web quản lý để bạn tiện chuyển khoản mà không cần mở lại file Excel.

---

## PHẦN 2: HƯỚNG DẪN ĐỐI SOÁT & THANH TOÁN (WEB APP)

Trang web đối soát giúp bạn quản lý hoa hồng tập trung, tự động tính toán tổng số tiền cần trả cho từng thành viên và thực hiện thanh toán nhanh chóng.

### 1. Đăng nhập trang quản trị
* Truy cập vào đường link Web App được cấp.
* Nhập **Mật khẩu truy cập** của admin $\rightarrow$ Bấm **Đăng nhập**.

### 2. Theo dõi hoa hồng thành viên
Trên giao diện Web, danh sách thành viên sẽ được sắp xếp tự động theo thứ tự **ai có nhiều hoa hồng chưa trả nhất ở trên cùng**. Bạn sẽ thấy các thông tin:
* Tổng số đơn hàng thành viên đã mua.
* Tổng doanh số mua hàng.
* **Tổng đã trả** và **Tổng chưa trả** (số tiền cần thanh toán cho khách).
* Thông tin tài khoản ngân hàng của khách (được đọc trực tiếp từ sheet `ThanhVien` mà bạn nhập tay).

### 3. Cách thực hiện thanh toán (Đánh dấu đã trả tiền)
Khi bạn muốn thanh toán tiền hoa hồng cho một thành viên:

#### Cách A: Thanh toán toàn bộ đơn hàng của thành viên đó (Nhanh nhất)
1. Trên dòng thông tin của thành viên, nhìn vào cột ngân hàng và tiến hành chuyển khoản ngân hàng số tiền ở mục **Tổng chưa trả** cho họ.
2. Sau khi chuyển khoản thành công, bấm nút **`Thanh Toán`** (màu cam) ngay bên cạnh tên thành viên đó.
3. Xác nhận **OK**. 
* **Kết quả**: Hệ thống sẽ tự động tìm tất cả các đơn hàng đang ở trạng thái `CHƯA TRẢ` của thành viên đó trong sheet `BaoCaoDonHang` chuyển thành `ĐÃ TRẢ` và tự động ghi nhận ngày giờ thanh toán. Số tiền **Tổng chưa trả** của người đó trên Web sẽ về `0 đ`.

#### Cách B: Thanh toán riêng lẻ từng đơn hàng
1. Bấm vào dòng tên của thành viên để mở rộng danh sách chi tiết tất cả đơn hàng họ đã mua.
2. Tìm đơn hàng cụ thể bạn muốn trả tiền, bấm vào chữ **`Chưa Trả`** ở cột ngoài cùng bên phải của đơn hàng đó.
3. Xác nhận **OK** để chuyển trạng thái đơn hàng đó thành **`Đã Trả`**.
