/*
 * FILE: server/src/index.js — ĐIỂM KHỞI ĐỘNG SERVER
 * ------------------------------------------------------------------
 * Đây là file chạy đầu tiên khi gõ `npm run dev` (hoặc nhấn F5 trong
 * VS Code với cấu hình "Server: debug").
 *   1. Tạo kết nối database (pool)
 *   2. Tạo app Express (app.js)
 *   3. Lắng nghe ở cổng PORT (mặc định 4000)
 * Mở thử http://localhost:4000/api/health — thấy {"ok":true} là server đã chạy.
 *
 * Nếu đã build giao diện (npm run build -> client/dist), server trả luôn
 * giao diện đó. Khi deploy (Render) chỉ cần chạy một server này.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));

const db = createPool();
const app = createApp({
  db,
  jwtSecret: config.jwtSecret,
  corsOrigin: config.corsOrigin,
  clientDir: existsSync(clientDist) ? clientDist : null,
});

app.listen(config.port, () => {
  console.log(`🐊 Server đang chạy tại http://localhost:${config.port}`);
});
