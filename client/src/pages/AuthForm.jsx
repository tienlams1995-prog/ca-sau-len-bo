/*
 * FILE: client/src/pages/AuthForm.jsx — FORM DÙNG CHUNG CHO ĐĂNG NHẬP & ĐĂNG KÝ
 * ------------------------------------------------------------------
 * LoginPage và RegisterPage gần giống nhau nên dùng chung form này,
 * khác nhau ở prop `mode` ('login' | 'register').
 * Đây là "controlled form": giá trị ô nhập lưu trong useState.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault(); // chặn trình duyệt tự tải lại trang khi submit form
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(form.username, form.password, form.displayName);
      else await login(form.username, form.password);
      navigate('/play');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card auth-form" onSubmit={onSubmit}>
      <h2>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>

      <label>
        Tên đăng nhập
        <input name="username" value={form.username} onChange={onChange} autoComplete="username" required />
      </label>

      {isRegister && (
        <label>
          Tên hiển thị <span className="muted">(không bắt buộc)</span>
          <input name="displayName" value={form.displayName} onChange={onChange} maxLength={50} />
        </label>
      )}

      <label>
        Mật khẩu
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button className="btn" disabled={submitting}>
        {submitting ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
      </button>

      <p className="muted">
        {isRegister ? (
          <>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></>
        ) : (
          <>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></>
        )}
      </p>
    </form>
  );
}
