# 🐊 Cá Sấu Lên Bờ — Web game dân gian

Đề án cuối khóa: web game dựa trên trò chơi dân gian **"Cá sấu lên bờ"**, gồm đủ 4 phần:

| Phần | Công nghệ | Thư mục |
|---|---|---|
| Database | PostgreSQL | [`db/`](db/) |
| Back-end + REST API | Node.js, Express 5, JWT, bcrypt | [`server/`](server/) |
| Front-end | React 18, Vite, Canvas | [`client/`](client/) |
| Logic game (dùng chung) | JavaScript thuần | [`shared/`](shared/) |

## 📚 Tài liệu giải thích (đọc theo thứ tự)

1. [Tổng quan & luồng dữ liệu](docs/01-tong-quan.md): đọc trước tiên
2. [Database](docs/02-database.md): các bảng, quan hệ, câu SQL quan trọng
3. [Back-end & API](docs/03-backend-api.md): Express, middleware, từng endpoint
4. [Logic game](docs/04-logic-game.md): game loop, va chạm, AI cá sấu, chống gian lận
5. [Front-end](docs/05-frontend.md): React, các trang, cách vẽ Canvas
6. [Cài đặt, chạy & debug trong VS Code](docs/06-chay-va-debug.md): **làm theo file này để chạy dự án**
7. [Đưa game lên mạng (Supabase + Render)](docs/07-deploy.md)

## 🚀 Chạy nhanh (khi đã cài Node.js + PostgreSQL)

```bash
npm install                      # cài thư viện cho cả 3 phần
copy server\.env.example server\.env   # rồi sửa mật khẩu DB trong file .env
npm run db:init                  # tạo bảng + dữ liệu mẫu
npm run dev                      # chạy server (4000) + client (5173)
```

Mở http://localhost:5173 để chơi, hoặc http://localhost:4000/api/docs để bấm thử từng API.

## 🧪 Kiểm thử

```bash
npm test
```
Chạy 20 test tự động: 11 cho logic game, 9 cho API. Phần test API dùng database giả lập nên không cần PostgreSQL.

## 🗂️ Cấu trúc thư mục

```
ca-sau-len-bo/
├── db/                  schema.sql (tạo bảng), seed.sql (dữ liệu mẫu)
├── shared/game/         luật chơi: index.js + game.test.js
├── server/
│   ├── src/
│   │   ├── index.js         điểm khởi động server
│   │   ├── app.js           lắp ráp Express
│   │   ├── config.js        đọc .env
│   │   ├── db/              kết nối DB, script khởi tạo
│   │   ├── middleware/      auth (JWT), xử lý lỗi
│   │   ├── routes/          mỗi file = một nhóm API
│   │   └── utils/           HttpError, toInt
│   └── test/api.test.js
├── client/
│   └── src/
│       ├── main.jsx, App.jsx    khởi động & bản đồ trang
│       ├── api/client.js        mọi lời gọi API
│       ├── context/             trạng thái đăng nhập
│       ├── components/          NavBar, GameCanvas
│       └── pages/               các trang
├── docs/                tài liệu giải thích
├── api.http             thử API trong VS Code (extension REST Client)
└── .vscode/             cấu hình Run/Debug & extension gợi ý
```

## 🛣️ Lộ trình

- [x] Tuần 1–2: DB, auth, API, game chơi với cá sấu AI, bảng xếp hạng, hồ sơ
- [ ] Tuần 3: multiplayer real-time (Socket.IO), hình ảnh/âm thanh, deploy
