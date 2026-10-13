-- Cá Sấu Lên Bờ — lược đồ CSDL (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  display_name  VARCHAR(50) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS difficulties (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(16) NOT NULL UNIQUE,
  name           VARCHAR(32) NOT NULL,
  croc_speed     REAL        NOT NULL,  -- px/giây lúc bắt đầu
  croc_count     INT         NOT NULL,
  max_shore_time REAL        NOT NULL   -- số giây tối đa được đứng trên bờ
);

CREATE TABLE IF NOT EXISTS matches (
  id            SERIAL PRIMARY KEY,
  user_id       INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  difficulty_id INT         NOT NULL REFERENCES difficulties(id),
  score         INT         NOT NULL CHECK (score >= 0),
  crossings     INT         NOT NULL CHECK (crossings >= 0),
  survived_ms   INT         NOT NULL CHECK (survived_ms >= 0),
  mode          VARCHAR(8)  NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'multi')),
  played_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng xếp hạng: lọc theo độ khó, sắp theo điểm
CREATE INDEX IF NOT EXISTS idx_matches_difficulty_score ON matches (difficulty_id, score);
-- Lịch sử ván của một người chơi
CREATE INDEX IF NOT EXISTS idx_matches_user_played ON matches (user_id, played_at);

-- Ảnh avatar người chơi tự upload để gắn lên từng nhân vật trong game.
-- Ảnh đã được trình duyệt thu nhỏ (128×128) rồi lưu dạng chuỗi "data URL",
-- nên không cần dịch vụ lưu file riêng.
CREATE TABLE IF NOT EXISTS avatars (
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character  VARCHAR(8)  NOT NULL CHECK (character IN ('player', 'croc', 'snake')),
  image      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, character)
);
