# 7. Đưa game lên mạng (Supabase + Render)

Sau khi làm xong, game có một địa chỉ dạng `https://ca-sau-len-bo.onrender.com` để gửi cho bạn bè chơi.

| Phần | Dịch vụ | Ghi chú |
|---|---|---|
| Database PostgreSQL | **Supabase** (miễn phí) | Không phải sửa code, chỉ đổi `DATABASE_URL` |
| Server + giao diện | **Render** (miễn phí) | Một dịch vụ duy nhất: Express trả cả API lẫn giao diện React đã build |

Cấu hình Render nằm sẵn trong [`render.yaml`](../render.yaml).

## Bước 1. Lấy chuỗi kết nối Supabase

1. Vào https://supabase.com/dashboard, mở project của bạn.
2. Bấm nút **Connect** ở thanh trên cùng.
3. Chọn **Session pooler** (KHÔNG chọn "Direct connection", vì Render không kết nối được kiểu đó).
4. Copy chuỗi dạng:
   `postgresql://postgres.abcxyz:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
5. Thay `[YOUR-PASSWORD]` bằng mật khẩu database bạn đặt lúc tạo project.
   Nếu mật khẩu có ký tự đặc biệt như `@ # / ?`, nên vào **Project Settings → Database → Reset database password** đặt mật khẩu chỉ gồm chữ và số cho dễ.

## Bước 2. Đưa code lên GitHub

1. Vào https://github.com/new, đặt tên `ca-sau-len-bo`, chọn **Private**, KHÔNG tick thêm README/.gitignore, bấm **Create repository**.
2. Trong VS Code, mở Terminal ở thư mục dự án và chạy (thay `TEN_BAN` bằng tên GitHub của bạn):
   ```bash
   git remote add origin https://github.com/TEN_BAN/ca-sau-len-bo.git
   git push -u origin main
   ```
   Lần đầu Windows sẽ mở cửa sổ đăng nhập GitHub, cứ đăng nhập bình thường.

File `server/.env` (chứa mật khẩu) KHÔNG bị đưa lên vì đã có trong `.gitignore`.

## Bước 3. Tạo dịch vụ trên Render

1. Vào https://dashboard.render.com, bấm **New → Blueprint**.
2. Kết nối GitHub (nếu được hỏi), chọn repo `ca-sau-len-bo`.
3. Render đọc `render.yaml` và hỏi giá trị `DATABASE_URL`: dán chuỗi kết nối ở Bước 1.
4. Bấm **Deploy Blueprint**. Đợi khoảng 3–5 phút.
5. Khi trạng thái là **Live**, bấm vào dịch vụ `ca-sau-len-bo` để thấy địa chỉ `https://....onrender.com`.

Mỗi lần build, Render tự chạy `npm run db:init` để tạo/cập nhật bảng trên Supabase, nên không phải làm tay.

## Cập nhật game sau này

Sửa code xong chỉ cần:
```bash
git add -A
git commit -m "mô tả thay đổi"
git push
```
Render tự build và cập nhật sau vài phút.

## Lưu ý gói miễn phí

- Render cho server **"ngủ"** sau 15 phút không ai vào. Lần mở đầu tiên sau đó phải chờ ~30–50 giây.
- Supabase **tạm dừng project** nếu 7 ngày không có ai dùng; vào dashboard bấm **Restore** là chạy lại, dữ liệu vẫn còn.

## Gặp lỗi?

| Hiện tượng | Cách xử lý |
|---|---|
| Build lỗi ở bước `db:init`, báo `password authentication failed` | Sai mật khẩu trong `DATABASE_URL`. Sửa ở Render: dịch vụ → **Environment** |
| Build lỗi `ENETUNREACH` hoặc `getaddrinfo` | Đang dùng "Direct connection". Đổi sang chuỗi **Session pooler** |
| Mở trang báo lỗi tải độ khó | Xem tab **Logs** của dịch vụ trên Render |
