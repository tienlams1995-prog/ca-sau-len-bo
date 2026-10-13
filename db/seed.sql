-- Dữ liệu mặc định: 3 mức độ khó
INSERT INTO difficulties (code, name, croc_speed, croc_count, max_shore_time) VALUES
  ('easy',   'Dễ',     110, 1, 4),
  ('normal', 'Thường', 140, 2, 3),
  ('hard',   'Khó',    165, 3, 2)
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  croc_speed     = EXCLUDED.croc_speed,
  croc_count     = EXCLUDED.croc_count,
  max_shore_time = EXCLUDED.max_shore_time;
