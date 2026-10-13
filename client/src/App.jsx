/*
 * FILE: client/src/App.jsx — KHUNG GIAO DIỆN & BẢN ĐỒ TRANG
 * ------------------------------------------------------------------
 * NavBar luôn hiện ở trên; phần dưới đổi theo URL:
 *   /             -> HomePage        (giới thiệu, luật chơi)
 *   /play         -> PlayPage        (chọn độ khó & chơi)
 *   /leaderboard  -> LeaderboardPage (bảng xếp hạng)
 *   /login        -> LoginPage
 *   /register     -> RegisterPage
 *   /profile      -> ProfilePage     (thống kê cá nhân, cần đăng nhập)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import HomePage from './pages/HomePage.jsx';
import PlayPage from './pages/PlayPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
