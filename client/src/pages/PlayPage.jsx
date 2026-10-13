/*
 * FILE: client/src/pages/PlayPage.jsx — TRANG CHƠI GAME
 * ------------------------------------------------------------------
 * Trang có 3 "giai đoạn" (biến phase):
 *   'select'  -> chọn độ khó (danh sách lấy từ API /api/difficulties)
 *                và chọn avatar gắn lên các nhân vật
 *   'playing' -> hiện <GameCanvas>
 *   'over'    -> hiện kết quả; nếu đã đăng nhập thì gọi API lưu điểm
 *                và hiện hạng. Khách (chưa đăng nhập) vẫn chơi được
 *                nhưng điểm không được lưu.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas.jsx';
import AvatarPicker from '../components/AvatarPicker.jsx';
import { useAvatars } from '../hooks/useAvatars.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PlayPage() {
  const { user } = useAuth();
  const { avatars, setAvatar, removeAvatar, error: avatarError } = useAvatars();
  const [difficulties, setDifficulties] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [phase, setPhase] = useState('select');
  const [result, setResult] = useState(null);
  const [saveInfo, setSaveInfo] = useState(null); // { status: 'saving'|'saved'|'error', ... }
  const [loadError, setLoadError] = useState('');
  const [round, setRound] = useState(0); // tăng lên mỗi lần chơi lại để tạo ván mới

  useEffect(() => {
    api
      .difficulties()
      .then((list) => {
        setDifficulties(list);
        setDifficulty(list[0] ?? null);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  function start() {
    setResult(null);
    setSaveInfo(null);
    setRound((r) => r + 1);
    setPhase('playing');
  }

  async function handleGameOver(res) {
    setResult(res);
    setPhase('over');
    if (!user) return;
    setSaveInfo({ status: 'saving' });
    try {
      const saved = await api.saveMatch(difficulty.id, res);
      setSaveInfo({ status: 'saved', rank: saved.rank, bestScore: saved.bestScore });
    } catch (err) {
      setSaveInfo({ status: 'error', message: err.message });
    }
  }

  if (loadError) {
    return <p className="error">Không tải được độ khó: {loadError}</p>;
  }

  return (
    <section>
      {phase === 'select' && (
        <div className="card center">
          <h2>Chọn độ khó</h2>
          <div className="difficulty-list">
            {difficulties.map((d) => (
              <button
                key={d.id}
                className={`difficulty ${difficulty?.id === d.id ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                <strong>{d.name}</strong>
                <span>{d.crocCount} cá sấu · {d.maxShoreTime}s trên bờ</span>
              </button>
            ))}
          </div>
          <AvatarPicker avatars={avatars} onPick={setAvatar} onRemove={removeAvatar} error={avatarError} />
          {!user && (
            <p className="muted">
              Bạn đang chơi với tư cách khách. <Link to="/login">Đăng nhập</Link> để lưu điểm, lên bảng xếp hạng và giữ avatar khi đổi máy.
            </p>
          )}
          <button className="btn btn-large" disabled={!difficulty} onClick={start}>
            Bắt đầu
          </button>
        </div>
      )}

      {phase !== 'select' && (
        <div className="game-wrap">
          <GameCanvas key={round} difficulty={difficulty} avatars={avatars} onGameOver={handleGameOver} />
        </div>
      )}

      {phase === 'over' && result && (
        <div className="card center result">
          <h2>Tới màn {result.stage} · {result.score} điểm</h2>
          <p>
            Qua sông {result.crossings} lần · Sống sót {(result.survivedMs / 1000).toFixed(1)} giây
          </p>
          {saveInfo?.status === 'saving' && <p className="muted">Đang lưu điểm…</p>}
          {saveInfo?.status === 'saved' && (
            <p>
              🏆 Điểm cao nhất của bạn (mức {difficulty.name}): <b>{saveInfo.bestScore}</b>, hạng <b>#{saveInfo.rank}</b>
            </p>
          )}
          {saveInfo?.status === 'error' && <p className="error">Lưu điểm thất bại: {saveInfo.message}</p>}
          <div className="actions">
            <button className="btn" onClick={start}>
              Chơi lại
            </button>
            <button className="btn btn-ghost" onClick={() => setPhase('select')}>
              Đổi độ khó
            </button>
            <Link className="btn btn-ghost" to="/leaderboard">
              Xem xếp hạng
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
