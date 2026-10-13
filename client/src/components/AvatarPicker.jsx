/*
 * FILE: client/src/components/AvatarPicker.jsx — CHỌN AVATAR CHO NHÂN VẬT
 * ------------------------------------------------------------------
 * Mỗi nhân vật (người chơi, cá sấu, rắn) có một ô: bấm "Chọn ảnh" để
 * upload ảnh từ máy/điện thoại, ảnh sẽ được gắn lên nhân vật trong game.
 * Props: avatars, onPick(character, file), onRemove(character), error
 */
import { CHARACTERS } from '../hooks/useAvatars.js';

export default function AvatarPicker({ avatars, onPick, onRemove, error }) {
  return (
    <div className="avatar-picker">
      <h3>Avatar nhân vật</h3>
      <div className="avatar-list">
        {CHARACTERS.map((c) => (
          <div key={c.id} className="avatar-item">
            <div className="avatar-preview">
              {avatars[c.id] ? <img src={avatars[c.id]} alt={`Avatar ${c.name}`} /> : <span>{c.icon}</span>}
            </div>
            <strong>{c.name}</strong>
            <label className="btn btn-small">
              Chọn ảnh
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ''; // chọn lại cùng một ảnh vẫn kích hoạt onChange
                  if (file) onPick(c.id, file);
                }}
              />
            </label>
            {avatars[c.id] && (
              <button className="link-button" onClick={() => onRemove(c.id)}>
                Bỏ ảnh
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
