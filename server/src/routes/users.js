/*
 * FILE: server/src/routes/users.js — THỐNG KÊ NGƯỜI CHƠI
 * ------------------------------------------------------------------
 *  GET /api/users/:id/stats
 *  -> { user, totals: { games, bestScore, avgScore, totalCrossings, longestMs },
 *       byDifficulty: [{ difficultyId, difficultyName, games, bestScore }] }
 *
 * Minh họa các hàm tổng hợp (aggregate) của SQL: COUNT, MAX, AVG, SUM,
 * COALESCE (đổi NULL thành 0 khi người chơi chưa có ván nào),
 * và LEFT JOIN (vẫn liệt kê độ khó dù người chơi chưa chơi mức đó).
 */
import { Router } from 'express';
import { HttpError, toInt } from '../utils/http.js';

export function usersRouter({ db }) {
  const router = Router();

  router.get('/:id/stats', async (req, res) => {
    const userId = toInt(req.params.id, 'id', { min: 1 });

    const userResult = await db.query(
      'SELECT id, username, display_name AS "displayName", created_at AS "createdAt" FROM users WHERE id = $1',
      [userId],
    );
    if (!userResult.rows[0]) throw new HttpError(404, 'Không tìm thấy người chơi');

    const totals = await db.query(
      `SELECT COUNT(*)::int                          AS "games",
              COALESCE(MAX(score), 0)::int           AS "bestScore",
              COALESCE(ROUND(AVG(score)), 0)::int    AS "avgScore",
              COALESCE(SUM(crossings), 0)::int       AS "totalCrossings",
              COALESCE(MAX(survived_ms), 0)::int     AS "longestMs"
       FROM matches WHERE user_id = $1`,
      [userId],
    );

    const byDifficulty = await db.query(
      `SELECT d.id AS "difficultyId", d.name AS "difficultyName",
              COUNT(m.id)::int AS "games",
              COALESCE(MAX(m.score), 0)::int AS "bestScore"
       FROM difficulties d
       LEFT JOIN matches m ON m.difficulty_id = d.id AND m.user_id = $1
       GROUP BY d.id, d.name
       ORDER BY d.id`,
      [userId],
    );

    res.json({ user: userResult.rows[0], totals: totals.rows[0], byDifficulty: byDifficulty.rows });
  });

  return router;
}
