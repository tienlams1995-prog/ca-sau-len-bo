# 1. Tổng quan dự án

## Ứng dụng làm gì?

Người chơi đăng ký tài khoản, chọn độ khó rồi chơi game "Cá sấu lên bờ" trên trình duyệt.
Hết ván, điểm được gửi lên server, lưu vào database và hiện trên bảng xếp hạng.

## Kiến trúc 3 lớp

```
┌────────────────────┐   HTTP + JSON    ┌────────────────────┐    SQL     ┌──────────────┐
│  FRONT-END (React) │ ───────────────▶ │  BACK-END (Express)│ ─────────▶ │  PostgreSQL  │
│  cổng 5173         │ ◀─────────────── │  cổng 4000         │ ◀───────── │  cổng 5432   │
│  client/           │                  │  server/           │            │  db/         │
└─────────┬──────────┘                  └─────────┬──────────┘            └──────────────┘
          │            ┌──────────────────┐        │
          └──────────▶ │ shared/game      │ ◀──────┘
                       │ (luật chơi chung)│
                       └──────────────────┘
```

- **Front-end** chỉ lo hiển thị và nhận thao tác. Nó **không** truy cập database trực tiếp.
- **Back-end** là "người gác cổng": kiểm tra đăng nhập, kiểm tra dữ liệu hợp lệ, rồi mới đọc/ghi database.
- **Database** lưu dữ liệu lâu dài: tài khoản, độ khó, kết quả các ván.
- **shared/game** chứa luật chơi. Front-end dùng nó để chạy game, back-end dùng nó để kiểm tra điểm.
  Nhờ vậy công thức tính điểm chỉ viết **một lần**.

## Ví dụ một luồng hoàn chỉnh: "Chơi xong một ván"

1. `GameCanvas.jsx` chạy vòng lặp game và gọi `update()` trong `shared/game` khoảng 60 lần/giây.
2. Cá sấu chạm người chơi → `state.over = true` → gọi `onGameOver({ crossings, survivedMs, score })`.
3. `PlayPage.jsx` gọi `api.saveMatch()` trong `client/src/api/client.js`.
4. Trình duyệt gửi `POST /api/matches` kèm header `Authorization: Bearer <token>`.
5. Vite (cổng 5173) chuyển tiếp request sang Express (cổng 4000), theo cấu hình proxy trong `client/vite.config.js`.
6. Express chạy lần lượt:
   - `middleware/auth.js` kiểm tra token và gắn `req.user`
   - `routes/matches.js` kiểm tra dữ liệu bằng `isPlausibleResult()`, chạy `INSERT INTO matches`, rồi tính hạng
7. Server trả JSON `{ match, bestScore, rank }` → PlayPage hiện "Hạng #3".

## Các khái niệm cần nắm để trình bày

| Khái niệm | Ở đâu trong dự án | Giải thích ngắn |
|---|---|---|
| REST API | `server/src/routes/` | Mỗi URL + phương thức (GET/POST) là một chức năng |
| JWT | `middleware/auth.js` | "Vé" đăng nhập có chữ ký, server kiểm tra mà không cần lưu phiên |
| Băm mật khẩu | `routes/auth.js` (bcrypt) | Không lưu mật khẩu gốc trong database |
| SQL có tham số | mọi `db.query(..., [..])` | Chống tấn công SQL injection |
| Foreign key | `db/schema.sql` | `matches.user_id` tham chiếu `users.id` |
| Middleware | `app.js` | Các hàm chạy nối tiếp trước khi tới route |
| React state/props | `pages/*.jsx` | Dữ liệu thay đổi thì giao diện tự cập nhật |
| Context | `context/AuthContext.jsx` | Chia sẻ "ai đang đăng nhập" cho mọi trang |
| Game loop | `components/GameCanvas.jsx` | Lặp lại: đọc phím → cập nhật → vẽ |
| Kiểm thử tự động | `*.test.js` | Chạy `npm test` để chắc chắn code không bị hỏng |
