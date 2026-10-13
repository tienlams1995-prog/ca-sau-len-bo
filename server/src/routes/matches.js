/*
 * FILE: server/src/routes/matches.js — LƯU & XEM KẾT QUẢ VÁN CHƠI
 * ------------------------------------------------------------------
 *  POST /api/matches     (cần đăng nhập)
 *       body: { difficultyId, crossings, survivedMs, score }
 *       -> lưu ván, trả về { match, bestScore, rank }
 *  GET  /api/matches/me  (cần đăng nhập) -> 20 ván gần nhất của tôi
 *
 * Chống gian lận: game chạy trên trình duyệt nên người chơi có thể gửi
 * điểm giả. Server dùng isPlausibleResult() từ shared/game (CÙNG công thức
 * tính điểm với front-end) để từ chối kết quả vô lý.
 */
import { Router } from 'express';
import { isPlausibleResult } from '@casau/shared';
import { HttpError, toInt } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

export function matchesRouter({ db, jwtSecret }) {
  const router = Router();
  router.use(requireAuth(jwtSecret)); // mọi route trong file này đều cần đăng nhập

  router.post('/', async (req, res) => {
    const body = req.body ?? {};
    const difficultyId = toInt(body.difficultyId, 'difficultyId', { min: 1 });
    const result = {
      crossings: toInt(body.crossings, 'crossings', { min: 0 }),
      survivedMs: toInt(body.survivedMs, 'survivedMs', { min: 0 }),
      score: toInt(body.score, 'score', { min: 0 }),
    };
    if (!isPlausibleResult(result)) {
      throw new HttpError(422, 'Kết quả ván chơi không hợp lệ');
    }

    const diff = await db.query('SELECT id FROM difficulties WHERE id = $1', [difficultyId]);
    if (!diff.rows.length) throw new HttpError(400, 'Độ khó không tồn tại');

    const { rows } = await db.query(
      `INSERT INTO matches (user_id, difficulty_id, score, crossings, survived_ms, mode)
       VALUES ($1, $2, $3, $4, $5, 'ai')
       RETURNING id, difficulty_id AS "difficultyId", score, crossings,
                 survived_ms AS "survivedMs", played_at AS "playedAt"`,
      [req.user.id, difficultyId, result.score, result.crossings, result.survivedMs],
    );

    // Điểm cao nhất của tôi ở độ khó này
    const best = await db.query(
      'SELECT MAX(score)::int AS best FROM matches WHERE user_id = $1 AND difficulty_id = $2',
      [req.user.id, difficultyId],
    );
    const bestScore = best.rows[0].best;

    // Hạng = 1 + số người có điểm cao nhất lớn hơn tôi
    const rank = await db.query(
      `SELECT COUNT(*)::int + 1 AS rank FROM (
         SELECT user_id, MAX(score) AS best
         FROM matches WHERE difficulty_id = $1
         GROUP BY user_id
       ) AS b
       WHERE b.best > $2`,
      [difficultyId, bestScore],
    );

    res.status(201).json({ match: rows[0], bestScore, rank: rank.rows[0].rank });
  });

  router.get('/me', async (req, res) => {
    const { rows } = await db.query(
      `SELECT m.id, m.score, m.crossings, m.survived_ms AS "survivedMs",
              m.played_at AS "playedAt", d.name AS "difficultyName"
       FROM matches m
       JOIN difficulties d ON d.id = m.difficulty_id
       WHERE m.user_id = $1
       ORDER BY m.played_at DESC, m.id DESC
       LIMIT 20`,
      [req.user.id],
    );
    res.json(rows);
  });

  return router;
}
