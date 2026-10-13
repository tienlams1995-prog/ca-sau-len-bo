/*
 * FILE: client/src/main.jsx — ĐIỂM KHỞI ĐỘNG FRONT-END
 * ------------------------------------------------------------------
 * Gắn ứng dụng React vào <div id="root"> trong index.html, bọc thêm:
 *  - BrowserRouter: cho phép chuyển trang theo URL (/play, /leaderboard...)
 *  - AuthProvider:  chia sẻ thông tin "ai đang đăng nhập" cho mọi trang
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
