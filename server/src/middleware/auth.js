/*
 * FILE: server/src/middleware/auth.js — KIỂM TRA ĐĂNG NHẬP (JWT)
 * ------------------------------------------------------------------
 * "Middleware" là hàm chạy TRƯỚC route chính, giống người gác cổng.
 *
 * Quy trình đăng nhập bằng JWT:
 *  1. Người dùng đăng nhập -> server tạo một "token" (chuỗi đã ký bằng
 *     JWT_SECRET) chứa id + username, gửi về front-end.
 *  2. Front-end lưu token, và mỗi request sau gửi kèm header:
 *        Authorization: Bearer <token>
 *  3. Middleware này đọc header, xác minh chữ ký. Hợp lệ -> gắn
 *     req.user = { id, username } rồi cho đi tiếp (next()).
 *     Không hợp lệ -> trả lỗi 401 (Unauthorized).
 *
 * Dùng trong route:  router.post('/', requireAuth(secret), handler)
 */
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http.js';

export function signToken(user, secret) {
  return jwt.sign({ sub: user.id, username: user.username }, secret, { expiresIn: '7d' });
}

export function requireAuth(secret) {
  return (req, _res, next) => {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Bạn cần đăng nhập');
    }
    try {
      const payload = jwt.verify(token, secret);
      req.user = { id: payload.sub, username: payload.username };
      next();
    } catch {
      throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }
  };
}
