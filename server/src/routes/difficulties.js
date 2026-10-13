/*
 * FILE: server/src/routes/difficulties.js — DANH SÁCH ĐỘ KHÓ
 * ------------------------------------------------------------------
 *  GET /api/difficulties  -> [{ id, code, name, crocSpeed, crocCount, maxShoreTime }]
 *
 * Độ khó được lưu trong DATABASE (bảng difficulties) chứ không viết cứng
 * trong code: muốn chỉnh game dễ/khó hơn chỉ cần sửa db/seed.sql
 * rồi chạy lại `npm run db:init`.
 * "AS "crocSpeed"" đổi tên cột snake_case (SQL) sang camelCase (JavaScript).
 */
import { Router } from 'express';

export const DIFFICULTY_COLUMNS = `id, code, name,
  croc_speed AS "crocSpeed", croc_count AS "crocCount", max_shore_time AS "maxShoreTime"`;

export function difficultiesRouter({ db }) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const { rows } = await db.query(`SELECT ${DIFFICULTY_COLUMNS} FROM difficulties ORDER BY id`);
    res.json(rows);
  });

  return router;
}
