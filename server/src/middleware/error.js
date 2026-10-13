/*
 * FILE: server/src/middleware/error.js — XỬ LÝ LỖI TẬP TRUNG
 * ------------------------------------------------------------------
 * Express nhận ra đây là "error handler" vì hàm có ĐÚNG 4 tham số
 * (err, req, res, next). Mọi lỗi ném ra trong route đều chảy về đây.
 *  - HttpError (lỗi ta chủ động ném) -> trả đúng mã + thông báo.
 *  - Lỗi khác (bug, mất kết nối DB...) -> in ra terminal để debug,
 *    và chỉ báo chung chung "Lỗi máy chủ" cho người dùng (không lộ chi tiết).
 */
import { HttpError } from '../utils/http.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Dữ liệu JSON không hợp lệ' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn' });
  }
  console.error('💥 Lỗi không mong muốn:', err);
  res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
}
