/*
 * FILE: server/src/routes/leaderboard.js — BẢNG XẾP HẠNG
 * ------------------------------------------------------------------
 *  GET /api/leaderboard?difficulty=2&limit=10
 *
 * Câu SQL dùng các kiến thức:
 *  - JOIN: ghép bảng matches với users để lấy tên hiển thị
 *  - GROUP BY + MAX(): mỗi người chỉ lấy ván điểm cao nhất
 *  - ORDER BY + LIMIT: sắp giảm dần, lấy top N
 *  - INDEX idx_matches_difficulty_score (db/schema.sql) giúp lọc nhanh
 */
import { Router } from 'express';
import { toInt } from '../utils/http.js';

export function leaderboardRouter({ db }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const difficultyId = toInt(req.query.difficulty ?? 1, 'difficulty', { min: 1 });
    const limit = toInt(req.query.limit ?? 10, 'limit', { min: 1, max: 50 });

    const { rows } = await db.query(
      `SELECT u.id AS "userId",
              u.display_name AS "displayName",
              MAX(m.score)::int AS "bestScore",
              MAX(m.survived_ms)::int AS "longestMs",
              COUNT(*)::int AS "games"
       FROM matches m
       JOIN users u ON u.id = m.user_id
       WHERE m.difficulty_id = $1
       GROUP BY u.id, u.display_name
       ORDER BY MAX(m.score) DESC, MAX(m.survived_ms) DESC
       LIMIT $2`,
      [difficultyId, limit],
    );
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  });

  return router;
}
