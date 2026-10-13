/*
 * FILE: client/src/components/NavBar.jsx — THANH ĐIỀU HƯỚNG
 * ------------------------------------------------------------------
 * Hiện các liên kết trang. Nếu đã đăng nhập -> tên + nút Đăng xuất,
 * chưa đăng nhập -> nút Đăng nhập / Đăng ký. Dữ liệu lấy từ useAuth().
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        🐊 Cá Sấu Lên Bờ
      </NavLink>
      <nav>
        <NavLink to="/play">Chơi</NavLink>
        <NavLink to="/leaderboard">Xếp hạng</NavLink>
        {user ? (
          <>
            <NavLink to="/profile">{user.displayName}</NavLink>
            <button
              className="link-button"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Đăng nhập</NavLink>
            <NavLink to="/register" className="btn btn-small">
              Đăng ký
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
