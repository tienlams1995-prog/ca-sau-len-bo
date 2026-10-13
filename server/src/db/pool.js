/*
 * FILE: server/src/db/pool.js — KẾT NỐI DATABASE
 * ------------------------------------------------------------------
 * "Pool" = một nhóm kết nối tới PostgreSQL được tái sử dụng,
 * thay vì mỗi request lại mở/đóng một kết nối mới (rất chậm).
 *
 * Cách dùng ở nơi khác:
 *   const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [5]);
 * $1, $2... là "tham số" — thư viện pg tự thoát ký tự đặc biệt,
 * nhờ vậy CHỐNG ĐƯỢC SQL INJECTION. Không bao giờ nối chuỗi SQL bằng tay!
 *
 * Database trên mạng (vd. Supabase) bắt buộc kết nối mã hóa SSL;
 * PostgreSQL trên máy mình (localhost) thì không cần.
 */
import pg from 'pg';
import { config } from '../config.js';

export function sslFor(connectionString) {
  const host = new URL(connectionString).hostname;
  return ['localhost', '127.0.0.1', '::1'].includes(host) ? false : { rejectUnauthorized: false };
}

export function createPool() {
  return new pg.Pool({ connectionString: config.databaseUrl, ssl: sslFor(config.databaseUrl) });
}
