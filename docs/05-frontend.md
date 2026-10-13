# 5. Front-end (React + Vite)

Thư mục: [`client/src/`](../client/src/)

## Cây component

```
main.jsx
└── BrowserRouter          (điều hướng theo URL)
    └── AuthProvider       (context/AuthContext.jsx — ai đang đăng nhập)
        └── App.jsx
            ├── NavBar
            └── Routes
                ├── /             HomePage
                ├── /play         PlayPage ──▶ GameCanvas
                ├── /leaderboard  LeaderboardPage
                ├── /login        LoginPage ──▶ AuthForm
                ├── /register     RegisterPage ──▶ AuthForm
                └── /profile      ProfilePage
```

## Từng file làm gì

| File | Vai trò |
|---|---|
| `api/client.js` | **Nơi duy nhất** gọi `fetch()`. Tự gắn token và chuyển lỗi server thành `Error` tiếng Việt |
| `context/AuthContext.jsx` | Lưu `user`, cung cấp `login()`, `register()`, `logout()` cho mọi trang qua `useAuth()` |
| `components/NavBar.jsx` | Thanh menu, hiển thị khác nhau khi đã/chưa đăng nhập |
| `components/GameCanvas.jsx` | Game loop: đọc phím → `update()` → vẽ Canvas |
| `pages/PlayPage.jsx` | Chọn độ khó → chơi → hiện kết quả và lưu điểm |
| `pages/LeaderboardPage.jsx` | Tab theo độ khó, bảng top 20 |
| `pages/ProfilePage.jsx` | Thống kê và lịch sử ván, gọi 2 API song song bằng `Promise.all` |
| `pages/AuthForm.jsx` | Form dùng chung cho đăng nhập và đăng ký |
| `styles.css` | Toàn bộ CSS, màu khai báo ở `:root` |

## Các hook React được dùng

| Hook | Dùng để | Ví dụ |
|---|---|---|
| `useState` | Dữ liệu thay đổi thì giao diện vẽ lại | `phase` trong PlayPage |
| `useEffect` | Chạy việc "bên ngoài" như gọi API, gắn sự kiện phím | Tải danh sách độ khó khi mở trang |
| `useRef` | Giữ giá trị **không** làm vẽ lại giao diện | State game đổi 60 lần/giây trong GameCanvas |
| `useContext` | Đọc dữ liệu dùng chung | `useAuth()` |

## Vì sao GameCanvas dùng `useRef` thay vì `useState`?

Mỗi lần gọi `setState`, React phải vẽ lại component. Game cập nhật 60 lần/giây, nếu dùng
`useState` thì React phải làm việc thừa rất nhiều. Vì vậy state game được giữ trong biến cục bộ bên trong `useEffect`,
và ta tự vẽ lên `<canvas>` bằng `ctx.fillRect`, `ctx.arc`… mà không cần React.

`requestAnimationFrame(loop)` yêu cầu trình duyệt gọi `loop` ở khung hình kế tiếp (thường 60 lần/giây)
và tự tạm dừng khi bạn chuyển sang tab khác.

## Proxy `/api`

Front-end chạy ở cổng 5173, còn server ở cổng 4000. Trong [`vite.config.js`](../client/vite.config.js) có:
```js
proxy: { '/api': 'http://localhost:4000' }
```
Nhờ vậy code chỉ cần viết `fetch('/api/leaderboard')`, Vite sẽ tự chuyển tiếp sang server.

## Khách vẫn chơi được

Chưa đăng nhập vẫn chơi được, chỉ là điểm không được lưu. `PlayPage` kiểm tra `if (!user) return;`
trước khi gọi `api.saveMatch()`.
