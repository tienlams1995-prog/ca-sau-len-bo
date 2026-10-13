/*
 * FILE: client/src/context/AuthContext.jsx — TRẠNG THÁI ĐĂNG NHẬP DÙNG CHUNG
 * ------------------------------------------------------------------
 * React "Context" giống một biến toàn cục có kiểm soát: mọi component
 * gọi useAuth() đều biết user hiện tại và gọi được login/logout.
 *
 * Khi mở trang: nếu có token cũ trong localStorage -> gọi /api/auth/me
 * để lấy lại thông tin user (giữ đăng nhập sau khi tải lại trang).
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setToken(null)) // token hết hạn -> xóa
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await api.login(username, password);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(username, password, displayName) {
    const data = await api.register(username, password, displayName);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
