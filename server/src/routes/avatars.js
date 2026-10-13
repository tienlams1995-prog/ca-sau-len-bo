/*
 * FILE: server/src/routes/avatars.js — AVATAR GẮN LÊN NHÂN VẬT
 * ------------------------------------------------------------------
 *  GET    /api/avatars/me          (cần đăng nhập) -> { player, croc, snake } (data URL hoặc null)
 *  PUT    /api/avatars/:character  (cần đăng nhập) body: { image: "data:image/jpeg;base64,..." }
 *  DELETE /api/avatars/:character  (cần đăng nhập) -> bỏ avatar, nhân vật vẽ như mặc định
 *
 * :character là 'player' (người chơi), 'croc' (cá sấu) hoặc 'snake' (rắn).
 * Trình duyệt đã thu nhỏ ảnh trước khi gửi; server chỉ nhận PNG/JPEG/WebP
 * (không nhận SVG vì SVG có thể chứa mã độc) và giới hạn kích thước.
 */
import { Router } from 'express';
import { HttpError } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

export const CHARACTERS = ['player', 'croc', 'snake'];
export const MAX_AVATAR_LENGTH = 150_000; // ký tự, ~110KB ảnh
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

function toCharacter(value) {
  if (!CHARACTERS.includes(value)) throw new HttpError(400, 'Nhân vật không hợp lệ');
  return value;
}

export function avatarsRouter({ db, jwtSecret }) {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  router.get('/me', async (req, res) => {
    const { rows } = await db.query('SELECT character, image FROM avatars WHERE user_id = $1', [req.user.id]);
    const result = Object.fromEntries(CHARACTERS.map((c) => [c, null]));
    for (const row of rows) result[row.character] = row.image;
    res.json(result);
  });

  router.put('/:character', async (req, res) => {
    const character = toCharacter(req.params.character);
    const image = req.body?.image;
    if (typeof image !== 'string' || !DATA_URL.test(image)) {
      throw new HttpError(400, 'Ảnh không hợp lệ (chỉ nhận PNG, JPEG, WebP)');
    }
    if (image.length > MAX_AVATAR_LENGTH) throw new HttpError(413, 'Ảnh quá lớn');

    await db.query(
      `INSERT INTO avatars (user_id, character, image) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, character) DO UPDATE SET image = EXCLUDED.image, updated_at = NOW()`,
      [req.user.id, character, image],
    );
    res.json({ character, image });
  });

  router.delete('/:character', async (req, res) => {
    const character = toCharacter(req.params.character);
    await db.query('DELETE FROM avatars WHERE user_id = $1 AND character = $2', [req.user.id, character]);
    res.status(204).end();
  });

  return router;
}
