/*
 * FILE: client/vite.config.js — CẤU HÌNH VITE (công cụ chạy/đóng gói React)
 * ------------------------------------------------------------------
 * proxy: khi front-end gọi fetch('/api/...') ở cổng 5173, Vite chuyển tiếp
 * request sang server Express ở cổng 4000. Nhờ vậy code front-end chỉ cần
 * viết đường dẫn ngắn '/api/...' và không bị lỗi CORS khi phát triển.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
