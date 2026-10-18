# 6. Cài đặt, chạy & debug trong VS Code

## Bước 0: Cài phần mềm (một lần)

1. **Node.js** bản 20 trở lên (máy bạn đang có v24, đủ dùng).
2. **PostgreSQL**: tải từ https://www.postgresql.org/download/windows/
   - Khi cài sẽ được hỏi mật khẩu cho user `postgres`. **Hãy ghi lại mật khẩu này.**
   - Cổng để mặc định `5432`.
   - Cài xong, mở **pgAdmin** (được cài kèm) → chuột phải *Databases* → *Create* → *Database* → đặt tên `casau`.
   - *Cách khác, không cần cài*: tạo database miễn phí trên https://neon.tech rồi copy chuỗi kết nối vào `DATABASE_URL`.
3. **VS Code**: mở thư mục `ca-sau-len-bo` (*File → Open Folder*). VS Code sẽ gợi ý cài các extension
   (REST Client, Database Client, Prettier). Bấm **Install All**.

## Bước 1: Cài thư viện

Mở terminal trong VS Code (`Ctrl + `` ` ``), gõ:
```bash
npm install
```
Lệnh này đọc các file `package.json` và tải thư viện vào thư mục `node_modules/`.

## Bước 2: Tạo file `.env`

```bash
copy server\.env.example server\.env
```
Mở `server/.env` và sửa dòng `DATABASE_URL`, thay mật khẩu bằng mật khẩu bạn đặt ở Bước 0:
```
DATABASE_URL=postgres://postgres:MAT_KHAU_CUA_BAN@localhost:5432/casau
```

## Bước 3: Tạo bảng

```bash
npm run db:init
```
Nếu database `casau` chưa có, script sẽ tự tạo (`🆕 Đã tạo database "casau".`), nên không bắt buộc phải tạo bằng pgAdmin.
Thấy `✅ Đã tạo bảng và dữ liệu mẫu thành công.` là xong.

## Bước 4: Chạy

```bash
npm run dev
```
Lệnh này chạy cùng lúc 2 chương trình: `[server]` (cổng 4000) và `[client]` (cổng 5173). Mở http://localhost:5173.
Muốn dừng thì bấm `Ctrl + C` trong terminal.

---

## 🐞 Debug (tìm lỗi)

### Debug server bằng breakpoint
1. Mở `server/src/routes/matches.js`, bấm vào lề trái cạnh số dòng trong hàm `router.post` (hiện chấm đỏ).
2. Mở tab **Run and Debug** (`Ctrl+Shift+D`) → chọn **"Server: debug (Express)"** → nhấn **F5**.
3. Ở terminal khác chạy `npm run dev -w client`, rồi chơi một ván.
4. Khi lưu điểm, VS Code dừng tại breakpoint. Rê chuột lên biến (ví dụ `req.body`) để xem giá trị.
   Nhấn F10 để chạy từng dòng, F5 để chạy tiếp.

> Lưu ý: khi debug server bằng F5 thì đừng chạy `npm run dev` ở gốc cùng lúc, vì cả hai sẽ tranh nhau cổng 4000.

### Debug front-end
- Trong trình duyệt nhấn **F12** → tab **Console** để xem lỗi JavaScript, tab **Network** để xem request gửi tới `/api`
  (bấm vào từng request để xem body gửi đi và kết quả trả về).
- Hoặc chọn **"Client: mở Chrome để debug React"** trong VS Code để đặt breakpoint ngay trong file `.jsx`.

### Thử API không cần giao diện
Dễ nhất: mở **http://localhost:4000/api/docs**, chọn API và bấm **Execute** (xem [03-backend-api.md](03-backend-api.md)).
Hoặc mở [`api.http`](../api.http) và bấm **Send Request** phía trên từng request.

### Chạy test
```bash
npm test
```
Hoặc chọn **"Test: server API"** / **"Test: logic game"** trong Run and Debug để đặt breakpoint ngay trong test.

---

## ❓ Lỗi thường gặp

| Thông báo | Nguyên nhân & cách sửa |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL chưa chạy. Mở *Services* trên Windows và Start dịch vụ `postgresql-x64-…` |
| `password authentication failed` | Sai mật khẩu trong `DATABASE_URL` (file `server/.env`) |
| `database "casau" does not exist` | Chưa tạo database `casau` (xem Bước 0) |
| `relation "users" does not exist` | Chưa chạy `npm run db:init` |
| `EADDRINUSE :::4000` | Cổng 4000 đang bị chiếm (có thể server đang chạy ở terminal khác). Tắt nó đi hoặc đổi `PORT` |
| Trên web báo "Không kết nối được server" | Server chưa chạy. Xem terminal có chữ `[server]` báo lỗi không |
| `Cannot find module ...` | Chưa chạy `npm install` ở **thư mục gốc** dự án |
