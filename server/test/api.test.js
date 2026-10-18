/*
 * FILE: server/test/api.test.js — KIỂM THỬ TỰ ĐỘNG CHO API
 * ------------------------------------------------------------------
 * Chạy:  npm test -w server   (hoặc npm test ở thư mục gốc)
 *
 * - pg-mem: một PostgreSQL GIẢ chạy trong bộ nhớ -> test không cần cài DB thật,
 *   và mỗi lần chạy đều bắt đầu từ database trống.
 * - supertest: gửi request HTTP tới app Express mà không cần mở cổng thật.
 * Mỗi test() là một kịch bản; assert kiểm tra kết quả có đúng mong đợi không.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { createApp } from '../src/app.js';
import { readSql } from '../src/db/init.js';
import { computeScore } from '@casau/shared';

async function setup() {
  const mem = newDb();
  // pg-mem chưa có sẵn hàm ROUND như PostgreSQL thật -> tự khai báo cho test
  for (const type of ['bigint', 'integer', 'float']) {
    mem.public.registerFunction({ name: 'round', args: [type], returns: type, implementation: (x) => (x == null ? null : Math.round(Number(x))) });
  }
  const { schema, seed } = await readSql();
  mem.public.none(schema);
  mem.public.none(seed);
  const { Pool } = mem.adapters.createPg();
  const app = createApp({ db: new Pool(), jwtSecret: 'test-secret' });
  return app;
}

async function registerUser(app, username) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password: 'matkhau123', displayName: `Bạn ${username}` });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

function result(crossings, survivedMs) {
  return { crossings, survivedMs, score: computeScore(crossings, survivedMs) };
}

test('health check', async () => {
  const app = await setup();
  const res = await request(app).get('/api/health');
  assert.deepEqual(res.body, { ok: true });
});

test('đăng ký, đăng nhập, xem thông tin bản thân', async () => {
  const app = await setup();
  const { token, user } = await registerUser(app, 'tien');
  assert.ok(token);
  assert.equal(user.displayName, 'Bạn tien');
  assert.equal(user.password_hash, undefined, 'không được lộ mật khẩu');

  const dup = await request(app).post('/api/auth/register').send({ username: 'tien', password: 'abcdef' });
  assert.equal(dup.status, 409);

  const wrong = await request(app).post('/api/auth/login').send({ username: 'tien', password: 'sai' });
  assert.equal(wrong.status, 401);

  const login = await request(app).post('/api/auth/login').send({ username: 'tien', password: 'matkhau123' });
  assert.equal(login.status, 200);

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
  assert.equal(me.body.user.username, 'tien');
});

test('đăng ký với dữ liệu sai bị từ chối', async () => {
  const app = await setup();
  const res = await request(app).post('/api/auth/register').send({ username: 'a', password: '1' });
  assert.equal(res.status, 400);
});

test('lấy danh sách độ khó từ database', async () => {
  const app = await setup();
  const res = await request(app).get('/api/difficulties');
  assert.equal(res.body.length, 3);
  assert.equal(res.body[0].code, 'easy');
  assert.equal(typeof res.body[0].crocSpeed, 'number');
});

test('lưu ván cần đăng nhập', async () => {
  const app = await setup();
  const res = await request(app).post('/api/matches').send({ difficultyId: 1, ...result(1, 5000) });
  assert.equal(res.status, 401);
});

test('lưu ván, chống gian lận, bảng xếp hạng và thống kê', async () => {
  const app = await setup();
  const a = await registerUser(app, 'anh');
  const b = await registerUser(app, 'binh');
  const post = (u, body) =>
    request(app).post('/api/matches').set('Authorization', `Bearer ${u.token}`).send(body);

  // Điểm giả bị từ chối
  const cheat = await post(a, { difficultyId: 1, crossings: 500, survivedMs: 1000, score: 5001 });
  assert.equal(cheat.status, 422);

  // An: 2 ván, Bình: 1 ván cao hơn
  assert.equal((await post(a, { difficultyId: 1, ...result(2, 10000) })).status, 201);
  assert.equal((await post(a, { difficultyId: 1, ...result(5, 30000) })).status, 201);
  const saved = await post(b, { difficultyId: 1, ...result(8, 40000) });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.rank, 1);
  assert.equal(saved.body.bestScore, computeScore(8, 40000));

  const lb = await request(app).get('/api/leaderboard?difficulty=1');
  assert.equal(lb.status, 200);
  assert.deepEqual(lb.body.map((r) => r.displayName), ['Bạn binh', 'Bạn anh']);
  assert.equal(lb.body[1].games, 2);
  assert.equal(lb.body[1].bestScore, computeScore(5, 30000));

  const mine = await request(app).get('/api/matches/me').set('Authorization', `Bearer ${a.token}`);
  assert.equal(mine.body.length, 2);
  assert.equal(mine.body[0].difficultyName, 'Dễ');

  const stats = await request(app).get(`/api/users/${a.user.id}/stats`);
  assert.equal(stats.status, 200);
  assert.equal(stats.body.totals.games, 2);
  assert.equal(stats.body.totals.totalCrossings, 7);
  assert.equal(stats.body.byDifficulty.length, 3);
  assert.equal(stats.body.byDifficulty[1].games, 0);
});

test('API không tồn tại trả 404', async () => {
  const app = await setup();
  const res = await request(app).get('/api/khong-co');
  assert.equal(res.status, 404);
});

test('avatar: lưu, đọc, thay, xóa, và từ chối ảnh không hợp lệ', async () => {
  const app = await setup();
  const { token } = await registerUser(app, 'avatar1');
  const auth = { Authorization: `Bearer ${token}` };
  const img = 'data:image/jpeg;base64,' + 'A'.repeat(20000); // lớn hơn giới hạn 10kb chung

  assert.equal((await request(app).get('/api/avatars/me')).status, 401);

  const empty = await request(app).get('/api/avatars/me').set(auth);
  assert.deepEqual(empty.body, { player: null, croc: null, snake: null });

  assert.equal((await request(app).put('/api/avatars/croc').set(auth).send({ image: img })).status, 200);
  assert.equal((await request(app).put('/api/avatars/croc').set(auth).send({ image: img + 'B' })).status, 200);
  const saved = await request(app).get('/api/avatars/me').set(auth);
  assert.equal(saved.body.croc, img + 'B');
  assert.equal(saved.body.player, null);

  const svg = await request(app).put('/api/avatars/snake').set(auth).send({ image: 'data:image/svg+xml;base64,PHN2Zz4=' });
  assert.equal(svg.status, 400);
  const badChar = await request(app).put('/api/avatars/dragon').set(auth).send({ image: img });
  assert.equal(badChar.status, 400);
  const huge = await request(app).put('/api/avatars/player').set(auth).send({ image: 'data:image/png;base64,' + 'A'.repeat(300000) });
  assert.equal(huge.status, 413);

  assert.equal((await request(app).delete('/api/avatars/croc').set(auth)).status, 204);
  assert.equal((await request(app).get('/api/avatars/me').set(auth)).body.croc, null);
});

test('trang thử API (Swagger) và bản đặc tả OpenAPI', async () => {
  const app = await setup();
  const page = await request(app).get('/api/docs');
  assert.equal(page.status, 200);
  assert.match(page.text, /swagger-ui/);

  const spec = await request(app).get('/api/openapi.json');
  assert.equal(spec.status, 200);
  assert.ok(spec.body.paths['/matches'].post, 'đặc tả phải có API lưu ván');

  // Ví dụ trong đặc tả phải là dữ liệu hợp lệ: bấm Execute là lưu được ngay
  const example = spec.body.paths['/matches'].post.requestBody.content['application/json'].example;
  const { token } = await registerUser(app, 'swagger');
  const saved = await request(app).post('/api/matches').set('Authorization', `Bearer ${token}`).send(example);
  assert.equal(saved.status, 201);

  const asset = await request(app).get('/api/docs/assets/swagger-ui-bundle.js');
  assert.equal(asset.status, 200);
});
