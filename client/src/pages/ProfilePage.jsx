/*
 * FILE: client/src/pages/ProfilePage.jsx — HỒ SƠ & THỐNG KÊ CÁ NHÂN
 * ------------------------------------------------------------------
 * Gọi song song 2 API bằng Promise.all:
 *   GET /api/users/:id/stats -> tổng số ván, điểm cao nhất...
 *   GET /api/matches/me      -> 20 ván gần nhất
 * Chưa đăng nhập -> chuyển về trang đăng nhập.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([api.userStats(user.id), api.myMatches()])
      .then(([s, m]) => {
        setStats(s);
        setMatches(m);
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (loading) return <p className="muted">Đang tải…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Đang tải…</p>;

  const t = stats.totals;
  return (
    <section>
      <h2>👤 {user.displayName}</h2>
      <div className="stat-grid">
        <Stat label="Số ván" value={t.games} />
        <Stat label="Điểm cao nhất" value={t.bestScore} />
        <Stat label="Điểm trung bình" value={t.avgScore} />
        <Stat label="Tổng lần qua sông" value={t.totalCrossings} />
        <Stat label="Sống lâu nhất" value={`${(t.longestMs / 1000).toFixed(1)}s`} />
      </div>

      <div className="card">
        <h3>Theo độ khó</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Độ khó</th>
              <th className="num">Số ván</th>
              <th className="num">Điểm cao nhất</th>
            </tr>
          </thead>
          <tbody>
            {stats.byDifficulty.map((d) => (
              <tr key={d.difficultyId}>
                <td>{d.difficultyName}</td>
                <td className="num">{d.games}</td>
                <td className="num">{d.bestScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Ván gần đây</h3>
        {matches.length === 0 ? (
          <p className="muted">Bạn chưa chơi ván nào.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Độ khó</th>
                <th className="num">Điểm</th>
                <th className="num">Qua sông</th>
                <th className="num">Sống sót</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.playedAt).toLocaleString('vi-VN')}</td>
                  <td>{m.difficultyName}</td>
                  <td className="num">{m.score}</td>
                  <td className="num">{m.crossings}</td>
                  <td className="num">{(m.survivedMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
