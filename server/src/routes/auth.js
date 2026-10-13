/*
 * FILE: server/src/routes/auth.js — ĐĂNG KÝ / ĐĂNG NHẬP
 * ------------------------------------------------------------------
 *  POST /api/auth/register  body: { username, password, displayName? }
 *  POST /api/auth/login     body: { username, password }
 *  GET  /api/auth/me        header: Authorization: Bearer <token>
 *
 * Mật khẩu KHÔNG BAO GIỜ lưu dạng chữ thường. bcrypt "băm" mật khẩu
 * thành chuỗi không thể dịch ngược; khi đăng nhập ta so sánh bằng
 * bcrypt.compare(). Nếu database bị lộ, kẻ xấu cũng không biết mật khẩu.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../utils/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

// Chọn các cột trả về cho front-end (không bao giờ trả password_hash)
const PUBLIC_USER_COLUMNS = 'id, username, display_name AS "displayName", created_at AS "createdAt"';

export function authRouter({ db, jwtSecret }) {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { username, password } = req.body ?? {};
    const displayName = (req.body?.displayName || username || '').trim();

    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      throw new HttpError(400, 'Tên đăng nhập gồm 3–32 ký tự: chữ không dấu, số hoặc dấu _');
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new HttpError(400, 'Mật khẩu phải có ít nhất 6 ký tự');
    }
    if (displayName.length > 50) {
      throw new HttpError(400, 'Tên hiển thị tối đa 50 ký tự');
    }

    const existing = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (existing.rows.length) throw new HttpError(409, 'Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (username, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [username, passwordHash, displayName],
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user, jwtSecret), user });
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'Thiếu tên đăng nhập hoặc mật khẩu');
    }
    const { rows } = await db.query(
      `SELECT password_hash, ${PUBLIC_USER_COLUMNS} FROM users WHERE username = $1`,
      [username],
    );
    const row = rows[0];
    // Cùng một thông báo cho cả 2 trường hợp, để kẻ xấu không dò được username nào tồn tại
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');
    }
    const { password_hash: _ignored, ...user } = row;
    res.json({ token: signToken(user, jwtSecret), user });
  });

  router.get('/me', requireAuth(jwtSecret), async (req, res) => {
    const { rows } = await db.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`, [req.user.id]);
    if (!rows[0]) throw new HttpError(404, 'Tài khoản không còn tồn tại');
    res.json({ user: rows[0] });
  });

  return router;
}
