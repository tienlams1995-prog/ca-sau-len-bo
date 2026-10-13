# 3. Back-end & REST API (Express)

Thư mục: [`server/src/`](../server/src/)

## Thứ tự các file chạy khi khởi động

```
index.js ──▶ config.js      (đọc .env)
         ──▶ db/pool.js     (tạo kết nối PostgreSQL)
         ──▶ app.js         (lắp ráp Express)
                 ├── cors(), express.json()
                 ├── routes/auth.js          /api/auth/*
                 ├── routes/difficulties.js  /api/difficulties
                 ├── routes/matches.js       /api/matches/*
                 ├── routes/leaderboard.js   /api/leaderboard
                 ├── routes/users.js         /api/users/*
                 └── middleware/error.js     (bắt mọi lỗi, đặt cuối cùng)
```

## Đường đi của một request

```
Request ─▶ cors ─▶ express.json ─▶ [requireAuth] ─▶ route handler ─▶ res.json(...)
                                         │                 │
                                         └── throw HttpError ──▶ errorHandler ─▶ { error: "..." }
```

- **Middleware** là hàm `(req, res, next)`. Gọi `next()` để chuyển tiếp, hoặc `throw` để báo lỗi.
- **Express 5** tự bắt lỗi trong hàm `async`, nên trong route chỉ cần `throw new HttpError(404, '...')`.

## Danh sách API

| Method | URL | Cần đăng nhập | Body / Query | Trả về |
|---|---|:-:|---|---|
| GET | `/api/health` | | | `{ ok: true }` |
| POST | `/api/auth/register` | | `{ username, password, displayName? }` | `{ token, user }` |
| POST | `/api/auth/login` | | `{ username, password }` | `{ token, user }` |
| GET | `/api/auth/me` | ✅ | | `{ user }` |
| GET | `/api/difficulties` | | | `[{ id, code, name, crocSpeed, crocCount, maxShoreTime }]` |
| POST | `/api/matches` | ✅ | `{ difficultyId, crossings, survivedMs, score }` | `{ match, bestScore, rank }` |
| GET | `/api/matches/me` | ✅ | | 20 ván gần nhất |
| GET | `/api/leaderboard` | | `?difficulty=1&limit=10` | `[{ rank, displayName, bestScore, longestMs, games }]` |
| GET | `/api/users/:id/stats` | | | `{ user, totals, byDifficulty }` |
| GET | `/api/avatars/me` | ✅ | | `{ player, croc, snake }` (ảnh data URL hoặc `null`) |
| PUT | `/api/avatars/:character` | ✅ | `{ image: "data:image/jpeg;base64,..." }` | `{ character, image }` |
| DELETE | `/api/avatars/:character` | ✅ | | 204 (không có nội dung) |

👉 Thử tất cả trong VS Code bằng file [`api.http`](../api.http) (cần extension REST Client).

## Mã trạng thái HTTP được dùng

| Mã | Ý nghĩa | Ví dụ trong dự án |
|---|---|---|
| 200 | OK | Lấy dữ liệu thành công |
| 201 | Created | Đăng ký, lưu ván thành công |
| 400 | Bad Request | Thiếu trường, sai kiểu dữ liệu |
| 401 | Unauthorized | Chưa đăng nhập, sai mật khẩu, token hết hạn |
| 404 | Not Found | Người chơi hoặc API không tồn tại |
| 409 | Conflict | Tên đăng nhập đã có người dùng |
| 413 | Payload Too Large | Ảnh avatar quá lớn |
| 422 | Unprocessable | Điểm gửi lên vô lý (nghi gian lận) |
| 500 | Server Error | Lỗi bất ngờ, xem log ở terminal |

## Bảo mật đã làm

1. **Mật khẩu được băm bằng bcrypt**: database chỉ lưu `password_hash`, không bao giờ trả trường này về front-end.
2. **JWT**: token có hạn 7 ngày, được ký bằng `JWT_SECRET`. Nếu token bị sửa, chữ ký sai và server từ chối.
3. **Đăng nhập sai luôn báo cùng một câu** "Sai tên đăng nhập hoặc mật khẩu", để kẻ xấu không dò được tài khoản nào tồn tại.
4. **SQL có tham số**: chống SQL injection.
5. **Kiểm tra điểm** bằng `isPlausibleResult()`: chặn điểm không khớp công thức, hoặc số lần qua sông vượt mức có thể chạy được trong thời gian đó.
6. **Giới hạn body 10kb**: chống gửi dữ liệu khổng lồ làm treo server.
7. **File `.env`** chứa bí mật và không được đưa lên Git.

## Vì sao `createApp({ db })` nhận db từ ngoài?

Đây là kỹ thuật **dependency injection**. Khi chạy thật, `index.js` truyền vào kết nối PostgreSQL thật.
Khi chạy test, `test/api.test.js` truyền vào **pg-mem**, một database giả nằm trong bộ nhớ.
Nhờ vậy test chạy được ở mọi máy mà không cần cài đặt gì thêm.
