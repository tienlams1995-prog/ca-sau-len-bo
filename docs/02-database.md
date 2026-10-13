# 2. Database (PostgreSQL)

File liên quan: [`db/schema.sql`](../db/schema.sql), [`db/seed.sql`](../db/seed.sql), [`server/src/db/`](../server/src/db/)

## Sơ đồ quan hệ (ERD)

```
┌──────────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
│ users            │         │ matches               │         │ difficulties         │
├──────────────────┤         ├───────────────────────┤         ├──────────────────────┤
│ id (PK)          │◀────┐   │ id (PK)               │   ┌────▶│ id (PK)              │
│ username UNIQUE  │     └───│ user_id (FK)          │   │     │ code UNIQUE          │
│ password_hash    │         │ difficulty_id (FK) ───│───┘     │ name                 │
│ display_name     │         │ score                 │         │ croc_speed           │
│ created_at       │         │ crossings             │         │ croc_count           │
└──────────────────┘         │ survived_ms           │         │ max_shore_time       │
                             │ mode ('ai'|'multi')   │         └──────────────────────┘
                             │ played_at             │
                             └───────────────────────┘
```

- **Một user có nhiều match** (quan hệ 1–N), nối qua `matches.user_id`.
- **Một difficulty có nhiều match** (1–N), nối qua `matches.difficulty_id`.
- `ON DELETE CASCADE`: xóa user thì các ván của user đó cũng tự xóa theo.
- Bảng **avatars** `(user_id, character, image)`: mỗi user có tối đa 1 ảnh cho mỗi nhân vật (`player`, `croc`, `snake`).
  Khóa chính gồm 2 cột `(user_id, character)`. Ảnh đã thu nhỏ còn 128×128 nên lưu thẳng dạng chuỗi data URL.

## Ý nghĩa từng ràng buộc (constraint)

| Ràng buộc | Tác dụng |
|---|---|
| `PRIMARY KEY` | Mỗi dòng có id duy nhất. `SERIAL` tự tăng 1, 2, 3… |
| `UNIQUE (username)` | Không có hai người trùng tên đăng nhập |
| `NOT NULL` | Bắt buộc phải có giá trị |
| `REFERENCES` (foreign key) | Không thể lưu ván với `user_id` không tồn tại |
| `CHECK (score >= 0)` | Database tự từ chối điểm âm, là lớp bảo vệ cuối cùng |
| `DEFAULT NOW()` | Tự điền thời điểm hiện tại |

## Index

```sql
CREATE INDEX idx_matches_difficulty_score ON matches (difficulty_id, score);
```
Index giống như mục lục sách. Khi bảng `matches` có hàng trăm nghìn dòng,
truy vấn bảng xếp hạng (`WHERE difficulty_id = ?` và sắp theo `score`) vẫn chạy nhanh.

## Vì sao độ khó nằm trong database?

Muốn chỉnh game (cá sấu nhanh hơn, thêm mức "Siêu khó") chỉ cần sửa `db/seed.sql`
rồi chạy lại `npm run db:init`, **không phải sửa code**. Front-end lấy danh sách qua `GET /api/difficulties`.

## Các câu SQL đáng chú ý

**Bảng xếp hạng** ([`routes/leaderboard.js`](../server/src/routes/leaderboard.js)): mỗi người lấy điểm cao nhất.
```sql
SELECT u.display_name, MAX(m.score) AS best, COUNT(*) AS games
FROM matches m JOIN users u ON u.id = m.user_id
WHERE m.difficulty_id = $1
GROUP BY u.id, u.display_name
ORDER BY MAX(m.score) DESC
LIMIT $2;
```

**Tính hạng của tôi** ([`routes/matches.js`](../server/src/routes/matches.js)): truy vấn con (subquery).
```sql
SELECT COUNT(*) + 1 AS rank FROM (
  SELECT user_id, MAX(score) AS best FROM matches
  WHERE difficulty_id = $1 GROUP BY user_id
) b WHERE b.best > $2;
```
Câu này đếm số người có điểm cao nhất lớn hơn tôi, cộng thêm 1 thì ra hạng của tôi.

**Thống kê theo độ khó** ([`routes/users.js`](../server/src/routes/users.js)): `LEFT JOIN` vẫn giữ lại các độ khó mà người chơi chưa chơi ván nào (số ván = 0).

## `$1`, `$2` là gì?

Đó là **tham số**. KHÔNG BAO GIỜ viết:
```js
db.query(`SELECT * FROM users WHERE username = '${username}'`) // ❌ nguy hiểm
```
Nếu người dùng nhập `' OR '1'='1`, câu SQL sẽ bị thay đổi ý nghĩa (**SQL injection**). Hãy viết:
```js
db.query('SELECT * FROM users WHERE username = $1', [username]) // ✅ an toàn
```

## Xem dữ liệu trong VS Code

Cài extension **Database Client** (`cweijan.vscode-postgresql-client2`) → bấm biểu tượng database ở thanh bên trái
→ **+** → chọn PostgreSQL → nhập host `localhost`, cổng `5432`, user/mật khẩu, database `casau`.
Từ đó bạn có thể mở bảng để xem dữ liệu, hoặc viết và chạy câu SQL ngay trong VS Code.
