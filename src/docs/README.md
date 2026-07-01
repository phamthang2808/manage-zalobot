# Hướng Dẫn Vận Hành Zalo Chatbot Săn Sale (Shopee Affiliate)

Hệ thống chatbot Zalo săn sale tự động chuyển đổi link Shopee thường sang link affiliate có gắn `sub_id` là tên người gửi tin nhắn. Hệ thống gồm 2 thành phần chính:
1. **zalo-bot**: Client Node.js kết nối Zalo Web (giả lập), lắng nghe và gửi phản hồi tin nhắn nhóm.
2. **spring-boot-backend**: API Java Spring Boot nhận dữ liệu, xử lý affiliate và định dạng tin nhắn phản hồi.

---

## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Khởi chạy Java Spring Boot Backend
Backend mặc định chạy trên cổng `8080`.

**Yêu cầu:** Java 17+ và Maven.

**Các bước thực hiện:**
1. Truy cập thư mục backend:
   ```bash
   cd spring-boot-backend
   ```
2. Cấu hình biến môi trường (Tùy chọn nếu có API Key):
   - `OPENAI_API_KEY`: API Key lấy từ OpenAI (để kích hoạt Spring AI định dạng tin nhắn vui nhộn). Nếu không có, Bot sẽ tự động sử dụng **template mặc định bằng Java**.
   - `SHOPEE_APP_ID`, `SHOPEE_SECRET`: Cấu hình API Shopee Affiliate thực tế. Nếu không có, Bot sẽ chạy ở chế độ **Giả lập (Mock API)** tự tạo link affiliate dạng: `https://shope.ee/mockAffiliate?url=...&sub_id=...`.
3. Chạy dự án:
   - Trên Windows:
     ```powershell
     mvn spring-boot:run
     ```
   - Hoặc bạn có thể package thành file jar và chạy:
     ```bash
     mvn clean package
     java -jar target/bot-zalo-backend-0.0.1-SNAPSHOT.jar
     ```

---

### 2. Khởi chạy Node.js Zalo Client
Zalo Client dùng để đăng nhập và lắng nghe tin nhắn từ Group Chat.

**Yêu cầu:** Node.js 18+.

**Các bước thực hiện:**
1. Truy cập thư mục bot:
   ```bash
   cd zalo-bot
   ```
2. Cấu hình file `.env` (mặc định đã cấu hình gọi sang `http://localhost:8080/api/zalo-webhook`).
3. Khởi chạy bot:
   ```bash
   npm start
   ```
4. **Quét mã QR**: Ở lần đầu tiên chạy, terminal sẽ hiển thị link quét mã QR Zalo hoặc in mã QR trực tiếp. Bạn dùng điện thoại (tài khoản Zalo phụ làm bot) quét mã này để đăng nhập.
5. Sau khi quét thành công, session đăng nhập sẽ được lưu tự động vào file `credentials.json`. Ở các lần chạy sau, bot sẽ tự động đăng nhập mà không cần quét lại mã QR.

---

## 🧪 Quy trình Kiểm thử

1. Thêm tài khoản Zalo Bot (tài khoản phụ vừa quét QR) vào nhóm Zalo test của bạn.
2. Dùng tài khoản cá nhân chính gửi một tin nhắn bất kỳ chứa link Shopee vào nhóm.
   - *Ví dụ:* `"Mọi người ơi mua dép này đẹp lắm https://shopee.vn/Dép-quai-ngang-nam-nữ-i.1234.5678"`
3. Quan sát logs ở Node.js và Java Backend:
   - Node.js sẽ nhận diện link Shopee, gọi hàm lấy tên của bạn, rồi gửi request Webhook sang Backend Java.
   - Backend Java sẽ thực hiện chuyển đổi link Shopee sang link Affiliate chứa tên của bạn làm `sub_id`, kết hợp với OpenAI (hoặc template) để viết lời phản hồi.
   - Node.js nhận kết quả và gửi trả lời trực tiếp (reply quote) tin nhắn của bạn trong nhóm Zalo sau 2-4 giây ngẫu nhiên.

---

## 🚀 Hướng Dẫn Deploy Lên Server (VPS Ubuntu/Linux)

Để chạy chatbot ổn định 24/7 trên server, chúng ta sẽ cấu hình Spring Boot chạy dưới dạng dịch vụ hệ thống (**systemd**) và Zalo Bot Node.js chạy dưới sự quản lý của **PM2**.

### 1. Kiến Trúc Triển Khai
- **Mạng nội bộ:** Cả hai dịch vụ đều chạy trên cùng một VPS.
- **Bảo mật:** Backend Spring Boot chạy trên cổng `8080` ở chế độ **local/localhost** (chỉ cho phép các ứng dụng trên cùng server gọi chéo, không mở cổng `8080` ra ngoài Internet). Điều này giúp bảo mật API tuyệt đối.
- **Zalo Bot Node.js:** Sẽ gọi sang Spring Boot nội bộ qua `http://localhost:8080/api/zalo-webhook`.

---

### 2. Chuẩn Bị Môi Trường Trên VPS
Truy cập vào VPS thông qua SSH và cài đặt các thành phần cần thiết:

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Java 17 (để chạy Backend)
sudo apt install openjdk-17-jre-headless -y

# Cài đặt Node.js (v18+) và NPM (để chạy Zalo Bot)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Cài đặt PM2 (quản lý Node.js chạy ngầm)
sudo npm install -g pm2
```

---

### 3. Deploy Spring Boot Backend

#### Bước 3.1: Đóng gói ứng dụng ở máy cá nhân (Local)
Trước khi upload lên server, bạn nên build dự án thành file `.jar` ngay tại máy cá nhân của mình để tiết kiệm tài nguyên server:
```bash
# Đứng ở thư mục /spring-boot-backend trên máy cá nhân
mvn clean package -DskipTests
```
Lệnh này sẽ tạo ra file `target/bot-zalo-backend-0.0.1-SNAPSHOT.jar`.

#### Bước 3.2: Upload file `.jar` lên VPS
Sử dụng công cụ SCP hoặc SFTP để tải file `.jar` lên server (ví dụ upload vào thư mục `/home/ubuntu/app/`):
```bash
scp spring-boot-backend/target/bot-zalo-backend-0.0.1-SNAPSHOT.jar user@ip_vps:/home/ubuntu/app/
```

#### Bước 3.3: Tạo dịch vụ systemd để chạy ngầm Backend
Tạo file dịch vụ hệ thống để Linux tự động quản lý và restart Spring Boot nếu server reboot hoặc crash:
```bash
sudo nano /etc/systemd/system/zalo-backend.service
```

Dán nội dung cấu hình sau (thay thế các biến môi trường thực tế của bạn):
```ini
[Unit]
Description=Zalo Chatbot Spring Boot Backend
After=syslog.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/usr/bin/java -jar bot-zalo-backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

# Khai báo các biến môi trường cấu hình API thực tế
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=OPENAI_API_KEY=YOUR_OPENAI_API_KEY
Environment=ECOMOBI_TOKEN=YOUR_ECOMOBI_TOKEN
Environment=ACCESSTRADE_TOKEN=YOUR_ACCESSTRADE_TOKEN
Environment=ACCESSTRADE_TIKTOK_CAMPAIGN_ID=YOUR_TIKTOK_CAMPAIGN_ID
Environment=SHOPEE_PUBLISHER_ID=an_17361610405
Environment=SHOPEE_COMMISSION_MULTIPLIER=1.0

[Install]
WantedBy=multi-user.target
```

Kích hoạt và khởi chạy dịch vụ:
```bash
# Tải lại cấu hình systemd
sudo systemctl daemon-reload

# Kích hoạt tự động chạy khi khởi động máy
sudo systemctl enable zalo-backend

# Khởi chạy dịch vụ
sudo systemctl start zalo-backend

# Xem log chạy thực tế
sudo journalctl -u zalo-backend -f
```

---

### 4. Deploy Zalo Bot (Node.js Client)

#### Bước 4.1: Upload thư mục `zalo-bot` lên VPS
Upload toàn bộ thư mục `zalo-bot` lên server (nhớ **bỏ qua** thư mục `node_modules`).
> [!IMPORTANT]
> **Mẹo tránh quét QR lại trên server:** Hãy copy luôn file `credentials.json` (đang lưu session đăng nhập thành công ở máy cá nhân của bạn) lên thư mục `zalo-bot` trên server. Khi đó, Bot trên VPS sẽ kế thừa session này và đăng nhập tự động, bạn không cần phải tìm cách hiển thị hay quét QR trên giao diện dòng lệnh (headless terminal) của server nữa.

#### Bước 4.2: Cài đặt và cấu hình trên VPS
Truy cập vào thư mục `zalo-bot` trên server:
```bash
cd /home/ubuntu/app/zalo-bot

# Cài đặt các thư viện cần thiết
npm install
```

Tạo file `.env` tại thư mục này trên server:
```env
BACKEND_URL=http://localhost:8080/api/zalo-webhook
```

#### Bước 4.3: Khởi chạy bằng PM2
Sử dụng PM2 để chạy ngầm và tự động khởi động lại bot Node.js:
```bash
# Khởi chạy bot
pm2 start index.js --name "zalo-bot"

# Xem log của bot trực tiếp
pm2 logs zalo-bot

# Xem trạng thái hoạt động
pm2 status
```

Cấu hình để PM2 tự khởi động cùng hệ thống:
```bash
pm2 startup
# Hãy copy và chạy lệnh sinh ra trên terminal (nếu có yêu cầu từ pm2)
pm2 save
```

---

### 5. Một số lệnh quản lý thường dùng trên VPS
- **Kiểm tra trạng thái backend:** `sudo systemctl status zalo-backend`
- **Restart backend:** `sudo systemctl restart zalo-backend`
- **Xem log backend:** `sudo journalctl -u zalo-backend -f -n 100`
- **Restart bot Zalo:** `pm2 restart zalo-bot`
- **Xem log bot Zalo:** `pm2 logs zalo-bot`
