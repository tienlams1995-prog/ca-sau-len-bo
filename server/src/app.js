/*
 * FILE: server/src/app.js — LẮP RÁP ỨNG DỤNG EXPRESS
 * ------------------------------------------------------------------
 * Hàm createApp() tạo app Express và gắn các thành phần theo thứ tự:
 *   1. cors()          cho phép front-end (khác cổng) gọi API
 *   2. express.json()  đọc body JSON của request vào req.body
 *   3. các router      mỗi nhóm API nằm trong một file ở routes/
 *   4. 404             API không tồn tại
 *   5. errorHandler    bắt mọi lỗi (PHẢI đặt cuối cùng)
 *   6. clientDir       (khi deploy) trả luôn giao diện React đã build,
 *                      để cả game chạy chung một địa chỉ
 *
 * Vì sao nhận `db` làm tham số thay vì tự import? Để file test có thể
 * truyền vào database giả (pg-mem) mà không cần cài PostgreSQL thật.
 * (Kỹ thuật này gọi là "dependency injection".)
 *
 * Express 5 tự bắt lỗi trong hàm async, nên route chỉ cần `throw`.
 */
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { difficultiesRouter } from './routes/difficulties.js';
import { matchesRouter } from './routes/matches.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { usersRouter } from './routes/users.js';
import { avatarsRouter } from './routes/avatars.js';
import { errorHandler } from './middleware/error.js';

export function createApp({ db, jwtSecret, corsOrigin, clientDir }) {
  const app = express();
  const deps = { db, jwtSecret };

  app.use(cors({ origin: corsOrigin || true }));
  // Ảnh avatar lớn hơn các request khác nên được giới hạn riêng, rộng hơn
  app.use('/api/avatars', express.json({ limit: '200kb' }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter(deps));
  app.use('/api/difficulties', difficultiesRouter(deps));
  app.use('/api/matches', matchesRouter(deps));
  app.use('/api/leaderboard', leaderboardRouter(deps));
  app.use('/api/users', usersRouter(deps));
  app.use('/api/avatars', avatarsRouter(deps));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy API này' }));
  app.use(errorHandler);

  if (clientDir) {
    app.use(express.static(clientDir));
    // Các đường dẫn như /play, /profile do React Router xử lý -> luôn trả index.html
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
  }

  return app;
}
