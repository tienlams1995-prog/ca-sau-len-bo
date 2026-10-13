/*
 * FILE: client/src/components/GameCanvas.jsx — MÀN HÌNH CHƠI GAME
 * ------------------------------------------------------------------
 * Component này làm 3 việc, lặp lại ~60 lần mỗi giây ("game loop"):
 *   1. ĐỌC PHÍM: phím mũi tên/WASD, hoặc giữ chuột/ngón tay trên màn hình
 *   2. CẬP NHẬT: gọi update() trong shared/game để tính trạng thái mới
 *   3. VẼ: vẽ nước, bờ, người chơi, cá sấu, rắn, điểm số lên thẻ <canvas>
 * Khi ván kết thúc -> gọi onGameOver(kếtQuả) để PlayPage lưu điểm.
 *
 * Dùng useRef (không phải useState) để giữ state game, vì state đổi
 * 60 lần/giây — nếu dùng useState React sẽ render lại liên tục, rất chậm.
 *
 * Props: difficulty {crocSpeed, crocCount, maxShoreTime}, onGameOver(result),
 *        avatars { player, croc, snake }: ảnh (data URL) gắn lên nhân vật, null = vẽ mặc định
 * Ván chơi chia thành nhiều màn ngắn (xem stageConfig trong shared/game).
 */
import { useEffect, useRef } from 'react';
import {
  WORLD,
  SHORES,
  PLAYER_RADIUS,
  CROC_RADIUS,
  SNAKE_RADIUS,
  createGame,
  update,
  getResult,
  computeScore,
} from '@casau/shared';

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export default function GameCanvas({ difficulty, avatars, onGameOver }) {
  const canvasRef = useRef(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  // Ảnh avatar đã nạp sẵn thành đối tượng Image để vẽ lên canvas mỗi khung hình
  const imagesRef = useRef({});

  useEffect(() => {
    const images = {};
    for (const [character, src] of Object.entries(avatars ?? {})) {
      if (!src) continue;
      const img = new Image();
      img.src = src;
      images[character] = img;
    }
    imagesRef.current = images;
  }, [avatars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let state = createGame(difficulty);
    const input = { up: false, down: false, left: false, right: false, target: null };
    let lastTime = performance.now();
    let frameId;
    let clock = 0; // đồng hồ riêng cho hiệu ứng sóng nước, chạy cả lúc đếm ngược
    let finished = false;

    // ---- 1. Đọc bàn phím ----
    const onKey = (e) => {
      const dir = KEY_MAP[e.code];
      if (!dir) return;
      e.preventDefault(); // không cho phím mũi tên cuộn trang
      input[dir] = e.type === 'keydown';
    };

    // ---- 1b. Đọc chuột / cảm ứng: giữ để người chơi chạy về điểm đó ----
    const toWorld = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * WORLD.width,
        y: ((e.clientY - rect.top) / rect.height) * WORLD.height,
      };
    };
    const onPointerDown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      input.target = toWorld(e);
    };
    const onPointerMove = (e) => {
      if (input.target) input.target = toWorld(e);
    };
    const onPointerUp = () => {
      input.target = null;
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // ---- Vòng lặp game ----
    const loop = (now) => {
      // dt tối đa 0.05s: nếu chuyển tab rồi quay lại, game không "nhảy cóc"
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      state = update(state, input, dt); // 2. cập nhật
      draw(ctx, state, clock, imagesRef.current); // 3. vẽ

      if (state.over && !finished) {
        finished = true;
        onGameOverRef.current(getResult(state));
        return; // dừng vòng lặp
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    // Dọn dẹp khi rời trang (tránh vòng lặp chạy ngầm)
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [difficulty]);

  return (
    <canvas
      ref={canvasRef}
      width={WORLD.width}
      height={WORLD.height}
      className="game-canvas"
      aria-label="Màn chơi Cá Sấu Lên Bờ"
    />
  );
}

/* =================== CÁC HÀM VẼ =================== */

function draw(ctx, state, clock, images) {
  drawWater(ctx, clock);
  SHORES.forEach((s) => drawShore(ctx, s));
  state.crocs.forEach((c) => drawCroc(ctx, c, images.croc));
  state.snakes.forEach((s) => drawSnake(ctx, s, clock, images.snake));
  drawPlayer(ctx, state, images.player);
  drawHud(ctx, state);
  if (state.countdown > 0) {
    const goal = `Qua sông ${state.config.goal} lần để qua màn`;
    if (state.stage === 1) drawCenterText(ctx, String(Math.ceil(state.countdown)), `Màn 1 · ${goal}`);
    else drawCenterText(ctx, `Màn ${state.stage}`, `Qua màn rồi! ${goal}`);
  }
  if (state.over) {
    drawCenterText(ctx, 'Bị bắt rồi!', OVER_REASONS[state.reason] ?? '');
  }
}

const OVER_REASONS = {
  caught: 'Cá sấu đã đớp bạn',
  bitten: 'Rắn đã cắn bạn',
  shore_timeout: 'Đứng trên bờ quá lâu',
};

/** Vẽ ảnh avatar bo tròn, tâm (x, y), bán kính r, kèm viền màu. */
function drawAvatar(ctx, img, x, y, r, ring) {
  if (!img?.complete || !img.naturalWidth) return false; // ảnh chưa nạp xong
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  return true;
}

function drawWater(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  g.addColorStop(0, '#3d9bd6');
  g.addColorStop(1, '#1f6fa8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // Gợn sóng chuyển động nhẹ
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 10; row++) {
    const y = 25 + row * 50;
    const offset = ((time * 30 + row * 37) % 120) - 120;
    for (let x = offset; x < WORLD.width; x += 120) {
      ctx.beginPath();
      ctx.arc(x + 30, y, 14, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawShore(ctx, s) {
  roundRect(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fillStyle = '#e6cf8f'; // cát
  ctx.fill();
  roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 10);
  ctx.fillStyle = '#7dbb5c'; // cỏ
  ctx.fill();
}

function drawCroc(ctx, c, avatar) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = '#3b7a35';
  // đuôi
  ctx.beginPath();
  ctx.moveTo(-20, -6);
  ctx.lineTo(-40, 0);
  ctx.lineTo(-20, 6);
  ctx.fill();
  // thân
  ctx.beginPath();
  ctx.ellipse(-2, 0, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // đầu + mõm
  ctx.beginPath();
  ctx.ellipse(22, 0, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // mắt
  ctx.fillStyle = '#ffd84d';
  [-6, 6].forEach((dy) => {
    ctx.beginPath();
    ctx.arc(14, dy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  // Avatar gắn trên lưng cá sấu (không xoay theo để ảnh luôn đứng thẳng)
  drawAvatar(ctx, avatar, c.x, c.y, CROC_RADIUS - 4, '#3b7a35');
}

function drawSnake(ctx, s, clock, avatar) {
  // Thân rắn: chuỗi đốt tròn phía sau đầu, uốn lượn theo hình sin
  const back = s.angle + Math.PI;
  const side = s.angle + Math.PI / 2;
  for (let i = 7; i >= 1; i--) {
    const wave = Math.sin(clock * 10 - i * 0.9) * 5;
    const bx = s.x + Math.cos(back) * i * 8 + Math.cos(side) * wave;
    const by = s.y + Math.sin(back) * i * 8 + Math.sin(side) * wave;
    ctx.fillStyle = i % 2 ? '#8a5a1f' : '#b07a2a';
    ctx.beginPath();
    ctx.arc(bx, by, SNAKE_RADIUS - i * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Đầu rắn
  ctx.fillStyle = '#6b4416';
  ctx.beginPath();
  ctx.arc(s.x, s.y, SNAKE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  if (drawAvatar(ctx, avatar, s.x, s.y, SNAKE_RADIUS, '#6b4416')) return;
  // Không có avatar: vẽ mắt và lưỡi
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  ctx.strokeStyle = '#e0303a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SNAKE_RADIUS - 2, 0);
  ctx.lineTo(SNAKE_RADIUS + 8, 0);
  ctx.moveTo(SNAKE_RADIUS + 5, 0);
  ctx.lineTo(SNAKE_RADIUS + 10, -3);
  ctx.moveTo(SNAKE_RADIUS + 5, 0);
  ctx.lineTo(SNAKE_RADIUS + 10, 3);
  ctx.stroke();
  ctx.fillStyle = '#ffd84d';
  [-5, 5].forEach((dy) => {
    ctx.beginPath();
    ctx.arc(4, dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawPlayer(ctx, state, avatar) {
  const { x, y } = state.player;
  // Vòng đếm thời gian còn lại trên bờ
  if (state.currentShore && state.countdown <= 0) {
    const left = 1 - state.shoreTime / state.config.maxShoreTime;
    ctx.strokeStyle = left > 0.35 ? '#ffffff' : '#ff4d4d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(left, 0));
    ctx.stroke();
  }
  if (drawAvatar(ctx, avatar, x, y, PLAYER_RADIUS + 2, '#e94f37')) return;
  ctx.fillStyle = '#e94f37'; // áo
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6c48f'; // mặt
  ctx.beginPath();
  ctx.arc(x, y - 2, PLAYER_RADIUS - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(x - 4, y - 4, 2, 3);
  ctx.fillRect(x + 2, y - 4, 2, 3);
}

function drawHud(ctx, state) {
  const survivedMs = Math.floor(state.t * 1000);
  const text = `Màn ${state.stage}: ${state.stageCrossings}/${state.config.goal}   ·   Điểm: ${computeScore(state.crossings, survivedMs)}   ·   ${state.t.toFixed(1)}s`;
  ctx.font = '600 18px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 32;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, (WORLD.width - w) / 2, 10, w, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, WORLD.width / 2, 27);
}

function drawCenterText(ctx, big, small) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText(big, WORLD.width / 2, WORLD.height / 2 - 16);
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText(small, WORLD.width / 2, WORLD.height / 2 + 34);
}
