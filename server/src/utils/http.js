/*
 * FILE: server/src/utils/http.js — TIỆN ÍCH XỬ LÝ LỖI & KIỂM TRA DỮ LIỆU
 * ------------------------------------------------------------------
 * HttpError: một loại lỗi có kèm mã HTTP (400, 401, 404, 409...).
 *   Trong route chỉ cần:  throw new HttpError(404, 'Không tìm thấy');
 *   -> middleware errorHandler (middleware/error.js) sẽ bắt lỗi và
 *      trả JSON { error: 'Không tìm thấy' } với mã 404 cho front-end.
 *
 * toInt: chuyển giá trị người dùng gửi lên thành số nguyên,
 *   nếu không hợp lệ thì ném HttpError 400 (Bad Request).
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function toInt(value, field, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `Giá trị "${field}" không hợp lệ`);
  }
  return n;
}
