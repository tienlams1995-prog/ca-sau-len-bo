/*
 * FILE: server/src/docs/router.js — TRANG THỬ API (SWAGGER UI)
 * ------------------------------------------------------------------
 *  GET /api/docs          -> trang web liệt kê mọi API, có nút bấm thử
 *  GET /api/openapi.json  -> bản đặc tả API (đọc từ docs/openapi.js)
 *  GET /api/docs/assets/… -> file giao diện của Swagger UI (thư viện swagger-ui-dist)
 *
 * Cách dùng: chạy `npm run dev` rồi mở http://localhost:4000/api/docs
 * (hoặc http://localhost:5173/api/docs). Mỗi API đã mở sẵn ô nhập dữ liệu,
 * chỉ cần bấm "Execute".
 *
 * Tiện ích thêm: khi gọi Đăng nhập / Đăng ký thành công, đoạn script bên dưới
 * tự lấy token trong kết quả và "Authorize" luôn, nên các API 🔒 dùng được ngay
 * mà không phải copy token bằng tay.
 */
import express, { Router } from 'express';
import swaggerUiDist from 'swagger-ui-dist';
import { openapiSpec } from './openapi.js';

const PAGE = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cá Sấu Lên Bờ — Thử API</title>
  <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css">
  <style>
    body { margin: 0; background: #fafafa; font-family: system-ui, sans-serif; }
    .guide { background: #12332b; color: #f5f1e6; padding: 16px 24px; line-height: 1.6; }
    .guide b { color: #e9a23b; }
    .guide ol { margin: 6px 0 0; padding-left: 22px; }
    #toast { position: fixed; right: 16px; bottom: 16px; background: #2f7d4a; color: #fff;
             padding: 12px 18px; border-radius: 10px; display: none; z-index: 10; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div class="guide">
    🐊 <b>Cách dùng:</b>
    <ol>
      <li>Bấm vào một API để mở ra (ví dụ <b>POST /auth/login</b>).</li>
      <li>Sửa dữ liệu trong ô <b>Request body</b> nếu muốn, rồi bấm nút xanh <b>Execute</b>.</li>
      <li>Xem kết quả ở mục <b>Server response</b>: mã <b>200/201</b> là thành công.</li>
    </ol>
    API có ổ khóa 🔒 cần đăng nhập: chạy <b>Đăng nhập</b> hoặc <b>Đăng ký</b> trước, trang tự lưu token.
  </div>
  <div id="swagger-ui"></div>
  <div id="toast"></div>
  <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
  <script>
    function showToast(text) {
      var t = document.getElementById('toast');
      t.textContent = text;
      t.style.display = 'block';
      setTimeout(function () { t.style.display = 'none'; }, 4000);
    }
    var ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      tryItOutEnabled: true,        // ô nhập dữ liệu mở sẵn, khỏi bấm "Try it out"
      persistAuthorization: true,   // tải lại trang vẫn giữ đăng nhập
      docExpansion: 'list',
      defaultModelsExpandDepth: -1, // ẩn mục "Schemas" ở cuối trang cho gọn
      displayRequestDuration: true,
      responseInterceptor: function (res) {
        // Đăng nhập / đăng ký thành công -> tự Authorize bằng token vừa nhận
        if (res.ok && /\\/api\\/auth\\/(login|register)$/.test(res.url) && res.body && res.body.token) {
          ui.preauthorizeApiKey('bearerAuth', res.body.token);
          showToast('✅ Đã đăng nhập: các API 🔒 dùng được rồi');
        }
        return res;
      },
    });
  </script>
</body>
</html>`;

export function docsRouter() {
  const router = Router();
  router.get('/openapi.json', (_req, res) => res.json(openapiSpec));
  router.get('/docs', (_req, res) => res.type('html').send(PAGE));
  router.use('/docs/assets', express.static(swaggerUiDist.getAbsoluteFSPath(), { index: false }));
  return router;
}
