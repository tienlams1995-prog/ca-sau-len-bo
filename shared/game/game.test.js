import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  update,
  getResult,
  computeScore,
  isPlausibleResult,
  COUNTDOWN_SECONDS,
  STAGE_BREAK_SECONDS,
  stageConfig,
} from './index.js';

const EASY = { crocSpeed: 110, crocCount: 1, maxShoreTime: 4 };
const DT = 1 / 60;

function run(state, input, seconds) {
  let s = state;
  for (let i = 0; i < Math.round(seconds / DT) && !s.over; i++) s = update(s, input, DT);
  return s;
}

test('đếm ngược: không ai di chuyển', () => {
  const s0 = createGame(EASY);
  const s1 = run(s0, { right: true }, COUNTDOWN_SECONDS - 0.5);
  assert.deepEqual(s1.player, s0.player);
  assert.equal(s1.t, 0);
});

test('update không sửa state cũ', () => {
  const s0 = createGame(EASY);
  const snapshot = JSON.stringify(s0);
  update({ ...s0, countdown: 0 }, { right: true }, DT);
  assert.equal(JSON.stringify(s0), snapshot);
});

test('đứng trên bờ quá lâu thì thua', () => {
  const s = run({ ...createGame(EASY), countdown: 0 }, {}, 10);
  assert.equal(s.over, true);
  assert.equal(s.reason, 'shore_timeout');
});

test('sang bờ khác được tính một lượt qua sông', () => {
  // Không có cá sấu (đặt ở góc xa) để kiểm tra riêng phần tính lượt
  const s0 = { ...createGame(EASY), countdown: 0, crocs: [{ x: 782, y: 482, angle: 0 }] };
  s0.config = { ...s0.config, crocSpeed: 0 };
  const s = run(s0, { target: { x: 295, y: 105 } }, 2); // tới đảo n1
  assert.equal(s.currentShore, 'n1');
  assert.equal(s.crossings, 1);
});

test('bị cá sấu chạm khi đang dưới nước thì thua', () => {
  const s0 = { ...createGame(EASY), countdown: 0 };
  s0.player = { x: 150, y: 250 };
  s0.currentShore = null;
  s0.crocs = [{ x: 170, y: 250, angle: 0 }];
  const s = update(s0, {}, DT);
  assert.equal(s.over, true);
  assert.equal(s.reason, 'caught');
});

test('getResult khớp với computeScore và hợp lệ', () => {
  const s = { ...createGame(EASY), t: 12.345, crossings: 4 };
  const r = getResult(s);
  assert.equal(r.survivedMs, 12345);
  assert.equal(r.score, computeScore(4, 12345));
  assert.equal(isPlausibleResult(r), true);
});

test('isPlausibleResult loại kết quả gian lận', () => {
  assert.equal(isPlausibleResult({ crossings: 100, survivedMs: 1000, score: 1001 }), false);
  assert.equal(isPlausibleResult({ crossings: 1, survivedMs: 5000, score: 999 }), false);
  assert.equal(isPlausibleResult({ crossings: -1, survivedMs: 5000, score: -5 }), false);
});

test('màn đầu dễ hơn độ khó đã chọn, các màn sau khó dần', () => {
  const HARD = { crocSpeed: 165, crocCount: 3, maxShoreTime: 2 };
  const s1 = stageConfig(HARD, 1);
  assert.equal(s1.crocCount, 1);
  assert.ok(s1.crocSpeed < HARD.crocSpeed);
  assert.ok(s1.maxShoreTime > HARD.maxShoreTime);
  const s9 = stageConfig(HARD, 9);
  assert.equal(s9.crocCount, 3);
  assert.ok(s9.crocSpeed > s1.crocSpeed);
  assert.equal(s9.maxShoreTime, HARD.maxShoreTime);
});

test('qua sông đủ số lần thì qua màn, có nghỉ giữa màn', () => {
  const s0 = { ...createGame(EASY), countdown: 0, crocs: [] };
  s0.config = { ...s0.config, goal: 1 };
  let s = s0;
  while (s.stage === 1 && !s.over && s.t < 5) s = update(s, { target: { x: 295, y: 105 } }, DT); // tới đảo n1
  assert.equal(s.over, false);
  assert.equal(s.stage, 2);
  assert.equal(s.stageCrossings, 0);
  assert.equal(s.countdown, STAGE_BREAK_SECONDS);
  assert.equal(s.crocs.length, stageConfig(EASY, 2).crocCount);
  assert.equal(getResult(s).stage, 2);
});

test('rắn chỉ xuất hiện từ màn 3, và bò chậm hơn cá sấu', () => {
  assert.equal(stageConfig(EASY, 1).snakeCount, 0);
  assert.equal(stageConfig(EASY, 2).snakeCount, 0);
  assert.equal(stageConfig(EASY, 3).snakeCount, 1);
  assert.ok(stageConfig(EASY, 3).snakeSpeed < stageConfig(EASY, 3).crocSpeed);
  assert.deepEqual(createGame(EASY).snakes, []);
});

test('bị rắn cắn thì thua, kể cả khi đang đứng trên bờ', () => {
  const s0 = { ...createGame(EASY), countdown: 0, crocs: [] };
  s0.snakes = [{ x: 60, y: 250, angle: 0 }]; // ngay cạnh người chơi trên bờ trái
  const s = update(s0, {}, DT);
  assert.equal(s.currentShore, 'left');
  assert.equal(s.over, true);
  assert.equal(s.reason, 'bitten');
});
