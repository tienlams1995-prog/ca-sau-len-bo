/*
 * =====================================================================
 *  FILE: shared/game/index.js — "BỘ NÃO" CỦA TRÒ CHƠI
 * =====================================================================
 *  File này chứa TOÀN BỘ luật chơi, viết bằng JavaScript thuần:
 *  không vẽ gì lên màn hình, không gọi API, không đụng database.
 *
 *  Ai dùng file này?
 *   - client/src/components/GameCanvas.jsx: mỗi khung hình (~60 lần/giây)
 *     gọi update() để tính vị trí mới, rồi tự vẽ ra Canvas.
 *   - server/src/routes/matches.js: gọi isPlausibleResult() để kiểm tra
 *     điểm người chơi gửi lên có hợp lệ không (chống gian lận).
 *   - (Tuần 3) server multiplayer sẽ chạy chính update() này trên server.
 *
 *  Ý tưởng chính: "state" (trạng thái) là một object mô tả ván chơi tại
 *  một thời điểm: người ở đâu, cá sấu ở đâu, bao nhiêu điểm...
 *  update(stateCũ, phímĐangBấm, dt) => stateMới
 *  (dt = số giây đã trôi qua kể từ khung hình trước, thường ≈ 0.016s)
 *
 *  Giải thích chi tiết: docs/04-logic-game.md
 *  Kiểm thử: shared/game/game.test.js  (chạy: npm test -w shared)
 * =====================================================================
 */

export const WORLD = { width: 800, height: 500 };
export const PLAYER_RADIUS = 14;
export const CROC_RADIUS = 18;
export const SNAKE_RADIUS = 12;
// Rắn xuất hiện từ màn này trở đi
export const SNAKE_FIRST_STAGE = 3;
export const PLAYER_SPEED = 220; // px/giây
export const COUNTDOWN_SECONDS = 3;
export const POINTS_PER_CROSSING = 10;
// Giới hạn hợp lý để server loại kết quả gian lận
export const MAX_CROSSINGS_PER_SECOND = 3;
export const MAX_SURVIVED_MS = 60 * 60 * 1000;
// Nghỉ giữa hai màn (giây): cá sấu về chỗ xuất phát, người chơi chuẩn bị
export const STAGE_BREAK_SECONDS = 2;

export const SHORES = [
  { id: 'left', x: 0, y: 0, w: 90, h: 500 },
  { id: 'right', x: 710, y: 0, w: 90, h: 500 },
  { id: 'n1', x: 250, y: 70, w: 90, h: 70 },
  { id: 'n2', x: 460, y: 70, w: 90, h: 70 },
  { id: 'n3', x: 355, y: 215, w: 90, h: 70 },
  { id: 'n4', x: 250, y: 360, w: 90, h: 70 },
  { id: 'n5', x: 460, y: 360, w: 90, h: 70 },
];

const CROC_SPAWNS = [
  { x: 180, y: 250 },
  { x: 630, y: 250 },
  { x: 400, y: 170 },
  { x: 400, y: 330 },
];

// Rắn bò được cả trên bờ lẫn dưới nước, xuất phát ở mép trên/dưới màn chơi
const SNAKE_SPAWNS = [
  { x: 400, y: 25 },
  { x: 400, y: 475 },
];

export function computeScore(crossings, survivedMs) {
  return crossings * POINTS_PER_CROSSING + Math.floor(survivedMs / 1000);
}

/** Kiểm tra một kết quả ván có hợp lệ không (dùng ở server). */
export function isPlausibleResult({ crossings, survivedMs, score }) {
  if (![crossings, survivedMs, score].every(Number.isInteger)) return false;
  if (crossings < 0 || survivedMs < 0 || survivedMs > MAX_SURVIVED_MS) return false;
  if (crossings > (survivedMs / 1000) * MAX_CROSSINGS_PER_SECOND + 1) return false;
  return score === computeScore(crossings, survivedMs);
}

/**
 * Thông số của từng màn. Ván chơi được chia thành nhiều màn ngắn:
 * màn đầu rất dễ, mỗi màn sau khó hơn một chút, dần đạt tới (rồi nhích
 * nhẹ quá) mức độ khó đã chọn.
 * @param {{crocSpeed:number, crocCount:number, maxShoreTime:number}} difficulty
 * @param {number} stage màn thứ mấy, bắt đầu từ 1
 */
export function stageConfig(difficulty, stage) {
  const k = stage - 1;
  const maxCrocs = Math.max(1, Math.min(difficulty.crocCount, CROC_SPAWNS.length));
  return {
    // Màn 1 cá sấu chỉ bơi 60% tốc độ, mỗi màn +8%, tối đa 120%
    crocSpeed: difficulty.crocSpeed * Math.min(0.6 + 0.08 * k, 1.2),
    // Thêm 1 cá sấu sau mỗi 2 màn
    crocCount: Math.min(maxCrocs, 1 + Math.floor(k / 2)),
    // Mấy màn đầu được đứng trên bờ lâu hơn (+2s, +1.5s, +1s, +0.5s)
    maxShoreTime: difficulty.maxShoreTime + Math.max(0, 2 - 0.5 * k),
    // Số lần qua sông để qua màn: 3, 3, 4, 4, 5, 5, 6, 6...
    goal: Math.min(3 + Math.floor(k / 2), 6),
    // Rắn: 1 con từ màn 3, 2 con từ màn 7. Bò chậm (45% -> tối đa 75%
    // tốc độ cá sấu) nhưng lên được bờ, nên đứng trên bờ không còn an toàn tuyệt đối
    snakeCount: stage < SNAKE_FIRST_STAGE ? 0 : stage < 7 ? 1 : 2,
    snakeSpeed: difficulty.crocSpeed * Math.min(0.45 + 0.03 * k, 0.75),
  };
}

/** Đặt kẻ địch ở các điểm xuất phát XA người chơi nhất. */
function spawnAt(spawns, count, player) {
  const dist = (p) => Math.hypot(p.x - player.x, p.y - player.y);
  return [...spawns]
    .sort((a, b) => dist(b) - dist(a))
    .slice(0, count)
    .map((p) => ({ ...p, angle: Math.atan2(player.y - p.y, player.x - p.x) }));
}

export function createGame(difficulty) {
  const config = stageConfig(difficulty, 1);
  const player = { x: 45, y: WORLD.height / 2 };
  return {
    difficulty,
    stage: 1,
    stageCrossings: 0, // số lần qua sông trong màn hiện tại
    config,
    countdown: COUNTDOWN_SECONDS,
    t: 0, // thời gian sống sót (giây), tính sau đếm ngược
    player,
    crocs: spawnAt(CROC_SPAWNS, config.crocCount, player),
    snakes: spawnAt(SNAKE_SPAWNS, config.snakeCount, player),
    currentShore: 'left',
    lastShore: 'left',
    shoreTime: 0,
    crossings: 0,
    over: false,
    reason: null, // 'caught' (cá sấu) | 'bitten' (rắn) | 'shore_timeout'
  };
}

/** Qua màn: tăng màn, cá sấu về chỗ xuất phát, nghỉ một chút. */
function nextStage(state) {
  const stage = state.stage + 1;
  const config = stageConfig(state.difficulty, stage);
  return {
    ...state,
    stage,
    stageCrossings: 0,
    config,
    countdown: STAGE_BREAK_SECONDS,
    crocs: spawnAt(CROC_SPAWNS, config.crocCount, state.player),
    snakes: spawnAt(SNAKE_SPAWNS, config.snakeCount, state.player),
    shoreTime: 0,
  };
}

export function shoreAt(x, y) {
  return SHORES.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) ?? null;
}

function circleHitsRect(cx, cy, r, s) {
  const nx = Math.max(s.x, Math.min(cx, s.x + s.w));
  const ny = Math.max(s.y, Math.min(cy, s.y + s.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

function crocCanBeAt(x, y) {
  if (x < CROC_RADIUS || y < CROC_RADIUS) return false;
  if (x > WORLD.width - CROC_RADIUS || y > WORLD.height - CROC_RADIUS) return false;
  return !SHORES.some((s) => circleHitsRect(x, y, CROC_RADIUS, s));
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function inputVector(player, input, step) {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (!dx && !dy && input.target) {
    const tx = input.target.x - player.x;
    const ty = input.target.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 2) return { dx: 0, dy: 0 };
    const len = Math.min(step, dist);
    return { dx: (tx / dist) * len, dy: (ty / dist) * len };
  }
  const len = Math.hypot(dx, dy);
  if (!len) return { dx: 0, dy: 0 };
  return { dx: (dx / len) * step, dy: (dy / len) * step };
}

function moveCroc(croc, target, step) {
  const tx = target.x - croc.x;
  const ty = target.y - croc.y;
  const dist = Math.hypot(tx, ty);
  if (dist < 1) return croc;
  const ux = tx / dist;
  const uy = ty / dist;
  // Thử đi thẳng; nếu vướng bờ thì trượt dọc theo trục hoặc vòng sang hai bên
  const candidates = [
    [ux, uy],
    [ux, 0],
    [0, uy],
    [-uy, ux],
    [uy, -ux],
  ];
  let best = null;
  for (const [cx, cy] of candidates) {
    if (!cx && !cy) continue;
    const l = Math.hypot(cx, cy);
    const nx = croc.x + (cx / l) * step;
    const ny = croc.y + (cy / l) * step;
    if (!crocCanBeAt(nx, ny)) continue;
    const d = Math.hypot(target.x - nx, target.y - ny);
    if (!best || d < best.d) best = { x: nx, y: ny, d, angle: Math.atan2(cy, cx) };
  }
  return best ? { x: best.x, y: best.y, angle: best.angle } : croc;
}

/** Rắn không bị bờ cản: cứ bò thẳng về phía người chơi. */
function moveSnake(snake, target, step) {
  const tx = target.x - snake.x;
  const ty = target.y - snake.y;
  const dist = Math.hypot(tx, ty);
  if (dist < 1) return snake;
  const len = Math.min(step, dist);
  return { x: snake.x + (tx / dist) * len, y: snake.y + (ty / dist) * len, angle: Math.atan2(ty, tx) };
}

/**
 * Tiến game thêm dt giây. Không sửa state cũ, trả về state mới.
 * @param input {up,down,left,right:boolean, target?:{x,y}}
 */
export function update(state, input, dt) {
  if (state.over) return state;

  if (state.countdown > 0) {
    return { ...state, countdown: Math.max(0, state.countdown - dt) };
  }

  const t = state.t + dt;

  // 1. Người chơi
  const { dx, dy } = inputVector(state.player, input ?? {}, PLAYER_SPEED * dt);
  const player = {
    x: clamp(state.player.x + dx, PLAYER_RADIUS, WORLD.width - PLAYER_RADIUS),
    y: clamp(state.player.y + dy, PLAYER_RADIUS, WORLD.height - PLAYER_RADIUS),
  };

  // 2. Bờ và tính lượt qua sông
  const shore = shoreAt(player.x, player.y);
  const currentShore = shore?.id ?? null;
  let { lastShore, crossings, stageCrossings } = state;
  let shoreTime = 0;
  if (currentShore) {
    shoreTime = state.currentShore === currentShore ? state.shoreTime + dt : 0;
    if (currentShore !== lastShore) {
      crossings += 1;
      stageCrossings += 1;
      lastShore = currentShore;
    }
  }

  // Đủ số lần qua sông -> qua màn (lúc này người chơi đang an toàn trên bờ)
  if (stageCrossings >= state.config.goal) {
    return nextStage({ ...state, t, player, currentShore, lastShore, crossings });
  }

  // 3. Cá sấu đuổi theo (tốc độ cố định trong một màn)
  const crocs = state.crocs.map((c) => moveCroc(c, player, state.config.crocSpeed * dt));
  //    Rắn bò theo, cả trên bờ lẫn dưới nước
  const snakes = state.snakes.map((s) => moveSnake(s, player, state.config.snakeSpeed * dt));

  // 4. Kết thúc ván?
  const touches = (list, radius) =>
    list.some((e) => Math.hypot(e.x - player.x, e.y - player.y) < PLAYER_RADIUS + radius);
  let over = false;
  let reason = null;
  if (touches(snakes, SNAKE_RADIUS)) {
    over = true;
    reason = 'bitten';
  } else if (!currentShore) {
    if (touches(crocs, CROC_RADIUS)) {
      over = true;
      reason = 'caught';
    }
  } else if (shoreTime > state.config.maxShoreTime) {
    over = true;
    reason = 'shore_timeout';
  }

  return {
    ...state, t, player, crocs, snakes, currentShore, lastShore, shoreTime, crossings, stageCrossings, over, reason,
  };
}

/** Kết quả ván để gửi lên server. */
export function getResult(state) {
  const survivedMs = Math.floor(state.t * 1000);
  return {
    crossings: state.crossings,
    survivedMs,
    score: computeScore(state.crossings, survivedMs),
    stage: state.stage, // màn cao nhất đã tới
    reason: state.reason,
  };
}
