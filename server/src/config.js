/*
 * FILE: server/src/config.js — ĐỌC CẤU HÌNH
 * ------------------------------------------------------------------
 * Gom mọi cấu hình (lấy từ file .env) vào một chỗ, để các file khác
 * chỉ cần `import { config } from './config.js'`.
 * Node tự nạp file .env nhờ cờ --env-file-if-exists trong package.json.
 */

export const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/casau',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-khong-dung-cho-production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Chưa đặt JWT_SECRET trong .env — đang dùng khóa mặc định (chỉ dùng khi học/thử).');
}
