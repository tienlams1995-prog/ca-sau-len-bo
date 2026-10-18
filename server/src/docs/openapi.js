/*
 * FILE: server/src/docs/openapi.js — "BẢN ĐẶC TẢ" API (chuẩn OpenAPI 3)
 * ------------------------------------------------------------------
 * Đây là tài liệu mô tả TẤT CẢ API của game: đường dẫn, dữ liệu gửi lên,
 * kết quả trả về, mã lỗi. Viết theo chuẩn OpenAPI (trước đây gọi là Swagger)
 * nên các công cụ khác đọc được:
 *   - Trang http://localhost:4000/api/docs đọc file này để vẽ giao diện bấm thử
 *   - Postman có thể Import địa chỉ http://localhost:4000/api/openapi.json
 *
 * Khi thêm hoặc sửa một API trong routes/, nhớ cập nhật file này cho khớp.
 * Các "example" là dữ liệu mẫu hợp lệ, bấm Execute là chạy được ngay.
 */

const errorResponse = (description, example) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: example } } },
});

const json = (example) => ({ 'application/json': { example } });

const UNAUTHORIZED = errorResponse('Chưa đăng nhập hoặc token hết hạn', 'Bạn cần đăng nhập');

// Ảnh PNG 1×1 điểm ảnh, dùng làm ví dụ cho API avatar
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Cá Sấu Lên Bờ — API',
    version: '1.0.0',
    description:
      'Tài liệu và nơi bấm thử toàn bộ API của game. ' +
      'Các API có biểu tượng 🔒 cần đăng nhập: chạy **Đăng nhập** (hoặc **Đăng ký**) trước, trang sẽ tự lưu token.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: '1. Tài khoản', description: 'Đăng ký, đăng nhập (ghi vào bảng users)' },
    { name: '2. Độ khó', description: 'Đọc bảng difficulties' },
    { name: '3. Ván chơi', description: 'Lưu và xem các ván chơi (bảng matches)' },
    { name: '4. Xếp hạng & thống kê', description: 'Tính từ bảng matches' },
    { name: '5. Avatar', description: 'Ảnh gắn lên nhân vật (bảng avatars)' },
    { name: 'Hệ thống', description: 'Kiểm tra server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          displayName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Hệ thống'],
        summary: 'Kiểm tra server còn chạy',
        responses: { 200: { description: 'Server đang chạy', content: json({ ok: true }) } },
      },
    },

    '/auth/register': {
      post: {
        tags: ['1. Tài khoản'],
        summary: 'Đăng ký tài khoản mới (thêm vào bảng users)',
        description: 'Đổi `username` thành tên chưa ai dùng trước khi bấm Execute. Đăng ký xong sẽ tự đăng nhập luôn.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', description: '3–32 ký tự: chữ không dấu, số hoặc dấu _' },
                  password: { type: 'string', description: 'Ít nhất 6 ký tự' },
                  displayName: { type: 'string', description: 'Tên hiển thị, tối đa 50 ký tự (không bắt buộc)' },
                },
              },
              example: { username: 'nguoichoi_moi', password: 'matkhau123', displayName: 'Người chơi mới' },
            },
          },
        },
        responses: {
          201: { description: 'Tạo thành công, trả về token và thông tin người chơi' },
          400: errorResponse('Dữ liệu không hợp lệ', 'Mật khẩu phải có ít nhất 6 ký tự'),
          409: errorResponse('Tên đăng nhập đã có người dùng', 'Tên đăng nhập đã tồn tại'),
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['1. Tài khoản'],
        summary: 'Đăng nhập (trang tự lưu token cho các API 🔒)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: { username: { type: 'string' }, password: { type: 'string' } },
              },
              example: { username: 'nguoichoi1', password: 'matkhau123' },
            },
          },
        },
        responses: {
          200: { description: 'Đăng nhập thành công, trả về token' },
          401: errorResponse('Sai tên đăng nhập hoặc mật khẩu', 'Sai tên đăng nhập hoặc mật khẩu'),
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['1. Tài khoản'],
        summary: 'Xem thông tin tài khoản đang đăng nhập',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Thông tin người chơi' }, 401: UNAUTHORIZED },
      },
    },

    '/difficulties': {
      get: {
        tags: ['2. Độ khó'],
        summary: 'Danh sách độ khó (1 = Dễ, 2 = Thường, 3 = Khó)',
        responses: {
          200: {
            description: 'Danh sách độ khó',
            content: json([{ id: 1, code: 'easy', name: 'Dễ', crocSpeed: 110, crocCount: 1, maxShoreTime: 4 }]),
          },
        },
      },
    },

    '/matches': {
      post: {
        tags: ['3. Ván chơi'],
        summary: 'Lưu kết quả một ván (thêm vào bảng matches)',
        description:
          'Điểm phải đúng công thức: **score = crossings × 10 + số giây sống sót** (bỏ phần lẻ).\n\n' +
          'Ví dụ: 3 lần qua sông, 20500 ms (20,5 giây) → score = 3 × 10 + 20 = **50**. ' +
          'Sai công thức sẽ bị từ chối với mã 422 (chống gian lận).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['difficultyId', 'crossings', 'survivedMs', 'score'],
                properties: {
                  difficultyId: { type: 'integer', description: '1 = Dễ, 2 = Thường, 3 = Khó' },
                  crossings: { type: 'integer', description: 'Số lần qua sông' },
                  survivedMs: { type: 'integer', description: 'Thời gian sống sót, đơn vị mili giây (1000 = 1 giây)' },
                  score: { type: 'integer', description: 'Điểm = crossings × 10 + số giây' },
                },
              },
              example: { difficultyId: 1, crossings: 3, survivedMs: 20500, score: 50 },
            },
          },
        },
        responses: {
          201: { description: 'Đã lưu. Trả về ván vừa lưu, điểm cao nhất và thứ hạng của bạn' },
          400: errorResponse('Thiếu hoặc sai kiểu dữ liệu', 'Giá trị "crossings" không hợp lệ'),
          401: UNAUTHORIZED,
          422: errorResponse('Điểm không đúng công thức (nghi gian lận)', 'Kết quả ván chơi không hợp lệ'),
        },
      },
    },

    '/matches/me': {
      get: {
        tags: ['3. Ván chơi'],
        summary: '20 ván gần nhất của tôi',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Danh sách ván chơi' }, 401: UNAUTHORIZED },
      },
    },

    '/leaderboard': {
      get: {
        tags: ['4. Xếp hạng & thống kê'],
        summary: 'Bảng xếp hạng theo độ khó',
        parameters: [
          { name: 'difficulty', in: 'query', description: '1 = Dễ, 2 = Thường, 3 = Khó', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', description: 'Lấy bao nhiêu người (1–50)', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Danh sách người chơi theo điểm cao nhất' } },
      },
    },

    '/users/{id}/stats': {
      get: {
        tags: ['4. Xếp hạng & thống kê'],
        summary: 'Thống kê của một người chơi',
        parameters: [{ name: 'id', in: 'path', required: true, description: 'Mã người chơi', schema: { type: 'integer', example: 1 } }],
        responses: {
          200: { description: 'Tổng số ván, điểm cao nhất, điểm trung bình, theo từng độ khó' },
          404: errorResponse('Không có người chơi này', 'Không tìm thấy người chơi'),
        },
      },
    },

    '/avatars/me': {
      get: {
        tags: ['5. Avatar'],
        summary: 'Xem avatar của 3 nhân vật (player, croc, snake)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Ảnh của từng nhân vật, hoặc null nếu chưa có' }, 401: UNAUTHORIZED },
      },
    },

    '/avatars/{character}': {
      parameters: [
        {
          name: 'character',
          in: 'path',
          required: true,
          description: 'player = người chơi, croc = cá sấu, snake = rắn',
          schema: { type: 'string', enum: ['player', 'croc', 'snake'] },
        },
      ],
      put: {
        tags: ['5. Avatar'],
        summary: 'Tải lên hoặc thay avatar (ghi vào bảng avatars)',
        description: 'Ảnh gửi dạng "data URL" (PNG, JPEG hoặc WebP). Ví dụ có sẵn là một ảnh 1×1 điểm ảnh.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['image'], properties: { image: { type: 'string' } } },
              example: { image: TINY_PNG },
            },
          },
        },
        responses: {
          200: { description: 'Đã lưu ảnh' },
          400: errorResponse('Ảnh không hợp lệ', 'Ảnh không hợp lệ (chỉ nhận PNG, JPEG, WebP)'),
          401: UNAUTHORIZED,
          413: errorResponse('Ảnh quá lớn', 'Ảnh quá lớn'),
        },
      },
      delete: {
        tags: ['5. Avatar'],
        summary: 'Xóa avatar, nhân vật trở về hình mặc định',
        security: [{ bearerAuth: [] }],
        responses: { 204: { description: 'Đã xóa' }, 401: UNAUTHORIZED },
      },
    },
  },
};
