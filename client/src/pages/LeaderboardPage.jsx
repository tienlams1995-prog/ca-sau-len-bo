/*
 * FILE: client/src/pages/LeaderboardPage.jsx — BẢNG XẾP HẠNG
 * ------------------------------------------------------------------
 * Tab theo độ khó. Mỗi lần đổi tab -> gọi GET /api/leaderboard?difficulty=ID
 * useEffect với [selected] nghĩa là: chạy lại mỗi khi `selected` thay đổi.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [difficulties, setDifficulties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true); // true ngay từ đầu để không thoáng hiện "Chưa có ai chơi"
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .difficulties()
      .then((list) => {
        setDifficulties(list);
        setSelected(list[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api
      .leaderboard(selected, 20)
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <section className="card">
      <h2>🏆 Bảng xếp hạng</h2>
      <div className="tabs">
        {difficulties.map((d) => (
          <button key={d.id} className={selected === d.id ? 'active' : ''} onClick={() => setSelected(d.id)}>
            {d.name}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="muted">Chưa có ai chơi mức này. Hãy là người đầu tiên!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Người chơi</th>
              <th className="num">Điểm cao nhất</th>
              <th className="num">Sống lâu nhất</th>
              <th className="num">Số ván</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className={user?.id === r.userId ? 'me' : ''}>
                <td>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                <td>{r.displayName}</td>
                <td className="num">{r.bestScore}</td>
                <td className="num">{(r.longestMs / 1000).toFixed(1)}s</td>
                <td className="num">{r.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
