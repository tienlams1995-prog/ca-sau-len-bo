# 4. Logic game

File: [`shared/game/index.js`](../shared/game/index.js) · Test: [`shared/game/game.test.js`](../shared/game/game.test.js)

## Luật chơi (bản web)

- Màn chơi rộng 800×500 (đơn vị: pixel "ảo"). Có 2 bờ lớn ở hai bên và 5 đảo nhỏ ở giữa.
- Người chơi bắt đầu ở bờ trái, sau 3 giây đếm ngược.
- Chạy tới **một bờ khác** với bờ vừa rời đi được **+10 điểm**. Quay lại đúng bờ vừa rời thì không được điểm, để chống "nhảy ra nhảy vào" lấy điểm.
- Mỗi giây sống sót được **+1 điểm**.
  → `điểm = số lần qua sông × 10 + số giây sống sót`  (hàm `computeScore`)
- Đứng trên một bờ quá `maxShoreTime` giây thì thua (`shore_timeout`).
- Đang ở dưới nước mà bị cá sấu chạm thì thua (`caught`). Đứng trên bờ thì an toàn.
- Cá sấu chỉ bơi dưới nước.
- Từ màn 3 có **rắn** (2 con từ màn 7): bò chậm hơn cá sấu nhưng **lên được bờ**, chạm vào là thua (`bitten`), kể cả khi đang đứng trên bờ.

### Chia màn (hàm `stageConfig`)

Ván chơi được chia thành nhiều **màn ngắn** để người chơi dễ qua dần, thay vì một ván dài cá sấu tăng tốc liên tục:

| | Màn 1 | Mỗi màn sau |
|---|---|---|
| Tốc độ cá sấu | 60% độ khó đã chọn | +8%, tối đa 120% |
| Số cá sấu | 1 | +1 sau mỗi 2 màn, tối đa bằng độ khó đã chọn |
| Thời gian đứng trên bờ | độ khó + 2s | thưởng giảm 0.5s mỗi màn, về đúng độ khó từ màn 5 |
| Số lần qua sông để qua màn | 3 | 3, 4, 4, 5, 5, 6 (tối đa 6) |

Khi qua màn: nghỉ 2 giây (`STAGE_BREAK_SECONDS`), cá sấu quay về các điểm xuất phát xa người chơi nhất.
Điểm vẫn tính như cũ nên bảng xếp hạng và kiểm tra chống gian lận không đổi.

## "State": toàn bộ ván chơi là một object

```js
{
  difficulty: { crocSpeed, crocCount, maxShoreTime }, // độ khó đã chọn
  stage: 2, stageCrossings: 1, // màn hiện tại, số lần qua sông trong màn
  config: { crocSpeed, crocCount, maxShoreTime, goal }, // thông số của màn hiện tại
  countdown: 3,                // giây đếm ngược còn lại
  t: 12.4,                     // số giây đã sống sót
  player: { x, y },
  crocs: [{ x, y, angle }],    // angle: hướng cá sấu quay mặt, dùng để vẽ
  currentShore: 'n3' | null,   // đang đứng trên bờ nào (null = dưới nước)
  lastShore: 'left',           // bờ gần nhất đã đứng, để tính lượt qua sông
  shoreTime: 1.2,              // đã đứng trên bờ hiện tại bao lâu
  crossings: 4,
  over: false, reason: null
}
```

## Hàm `update(state, input, dt)`: mỗi khung hình làm 4 bước

1. **Di chuyển người chơi** theo phím (hoặc theo điểm chuột/ngón tay). Quãng đường = `tốc độ × dt`.
   Nhân với `dt` giúp game chạy cùng tốc độ trên máy 60Hz hay 144Hz.
2. **Kiểm tra bờ**: dùng `shoreAt(x, y)` xem người đang đứng trên bờ nào. Nếu là bờ mới thì `crossings + 1`.
3. **Di chuyển cá sấu**: hàm `moveCroc` thử 5 hướng (thẳng tới người chơi, trượt ngang, trượt dọc, vòng trái, vòng phải),
   bỏ những hướng đâm vào bờ, rồi chọn hướng đưa nó **gần người chơi nhất**. Đây là một dạng AI "tham lam" (greedy) đơn giản.
4. **Kiểm tra thua**:
   - Va chạm hai hình tròn: `khoảng cách tâm < bán kính 1 + bán kính 2`.
     Khoảng cách tính bằng `Math.hypot(dx, dy)` = √(dx² + dy²) (định lý Pythagore).
   - Cá sấu không được lên bờ: kiểm tra va chạm hình tròn với hình chữ nhật trong `circleHitsRect`
     (tìm điểm gần tâm tròn nhất trên hình chữ nhật, rồi so khoảng cách với bán kính).

`update` **không sửa state cũ** mà trả về state mới. Cách viết "hàm thuần" (pure function) này giúp:
- dễ test: cho đầu vào X thì luôn ra Y;
- dùng lại được trên server khi làm multiplayer.

## Chống gian lận (`isPlausibleResult`)

Game chạy trên máy người chơi, nên họ có thể mở DevTools và gửi điểm giả. Server kiểm tra:
- các giá trị phải là số nguyên không âm, thời gian sống sót ≤ 1 giờ;
- `crossings` không vượt quá 3 lần mỗi giây (khoảng cách các bờ không cho phép chạy nhanh hơn);
- `score` phải **đúng bằng** `computeScore(crossings, survivedMs)`.

Cách này không chặn được 100% gian lận (muốn chặn hoàn toàn thì phải chạy game trên server, chính là phần multiplayer ở tuần 3),
nhưng đủ để loại các con số vô lý.

## Muốn chỉnh game?

| Muốn | Sửa ở đâu |
|---|---|
| Đổi tốc độ, số cá sấu, thời gian trên bờ | `db/seed.sql`, rồi chạy `npm run db:init` |
| Đổi vị trí và kích thước các bờ | mảng `SHORES` trong `shared/game/index.js` |
| Đổi cách tăng độ khó giữa các màn | `stageConfig` trong `shared/game/index.js` |
| Đổi số rắn, tốc độ rắn | `snakeCount`, `snakeSpeed` trong `stageConfig` |
| Đổi tốc độ người chơi | `PLAYER_SPEED` |
| Đổi cách tính điểm | `computeScore` (front-end và server tự dùng chung) |

Sau khi sửa, chạy `npm test` để chắc chắn không làm hỏng gì.
