/*
 * FILE: server/src/db/init.js — TẠO BẢNG + DỮ LIỆU MẪU
 * ------------------------------------------------------------------
 * Chạy bằng lệnh:  npm run db:init   (ở thư mục gốc dự án)
 * Script làm lần lượt:
 *   0. Nếu database (vd. "casau") chưa tồn tại -> tự tạo
 *   1. db/schema.sql — tạo các bảng (users, difficulties, matches)
 *   2. db/seed.sql   — thêm 3 mức độ khó mặc định
 * Chạy lại nhiều lần vẫn an toàn (dùng IF NOT EXISTS / ON CONFLICT).
 * Nhờ script này bạn KHÔNG cần cài công cụ psql hay mở pgAdmin.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config.js';
import { createPool, sslFor } from './pool.js';

/**
 * Kết nối vào database mặc định "postgres" (luôn có sẵn) để kiểm tra
 * và tạo database của dự án nếu chưa có.
 */
async function ensureDatabaseExists() {
  const url = new URL(config.databaseUrl);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) throw new Error(`Tên database không hợp lệ: ${dbName}`);

  url.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: url.toString(), ssl: sslFor(config.databaseUrl) });
  await admin.connect();
  try {
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (!rows.length) {
      // Tên database không truyền bằng $1 được, nên đã kiểm tra ký tự hợp lệ ở trên
      await admin.query(`CREATE DATABASE ${dbName}`);
      console.log(`🆕 Đã tạo database "${dbName}".`);
    }
  } finally {
    await admin.end();
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(here, '../../../db');

export async function readSql() {
  const schema = await readFile(path.join(sqlDir, 'schema.sql'), 'utf8');
  const seed = await readFile(path.join(sqlDir, 'seed.sql'), 'utf8');
  return { schema, seed };
}

// Chỉ chạy phần dưới khi gọi trực tiếp "node src/db/init.js"
// (không chạy khi file test import hàm readSql ở trên)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let pool;
  try {
    await ensureDatabaseExists();
    pool = createPool();
    const { schema, seed } = await readSql();
    await pool.query(schema);
    await pool.query(seed);
    console.log('✅ Đã tạo bảng và dữ liệu mẫu thành công.');
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo database:', err.message);
    console.error('   Kiểm tra PostgreSQL đã chạy chưa và DATABASE_URL trong server/.env');
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}
