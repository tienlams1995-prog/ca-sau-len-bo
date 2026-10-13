/*
 * FILE: client/src/hooks/useAvatars.js — AVATAR GẮN LÊN NHÂN VẬT
 * ------------------------------------------------------------------
 * Trả về { avatars, setAvatar, removeAvatar, error }
 *   avatars = { player, croc, snake }: mỗi giá trị là ảnh dạng data URL hoặc null
 *
 * - Đã đăng nhập: lưu trên server (API /api/avatars), đổi máy vẫn còn.
 * - Khách: lưu trong localStorage của trình duyệt này.
 *
 * Ảnh được thu nhỏ còn 128×128 ngay trên trình duyệt trước khi lưu,
 * nên gửi lên server chỉ khoảng 5–15KB thay vì cả ảnh gốc vài MB.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export const CHARACTERS = [
  { id: 'player', name: 'Người chơi', icon: '🧍' },
  { id: 'croc', name: 'Cá sấu', icon: '🐊' },
  { id: 'snake', name: 'Rắn', icon: '🐍' },
];

const EMPTY = { player: null, croc: null, snake: null };
const LOCAL_KEY = 'casau_avatars';
const AVATAR_SIZE = 128;

function readLocal() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') };
  } catch {
    return EMPTY;
  }
}

function writeLocal(avatars) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(avatars));
  } catch {
    /* trình duyệt chặn hoặc đầy bộ nhớ: avatar chỉ còn tới khi tải lại trang */
  }
}

/** Cắt ảnh thành hình vuông ở giữa, thu nhỏ còn 128×128, trả về data URL JPEG. */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn một file ảnh'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = AVATAR_SIZE;
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh này'));
    };
    img.src = url;
  });
}

export function useAvatars() {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!user) {
      setAvatars(readLocal());
      return;
    }
    api
      .myAvatars()
      .then(setAvatars)
      .catch((err) => setError(err.message));
  }, [user]);

  function apply(next) {
    setAvatars(next);
    if (!user) writeLocal(next);
  }

  async function setAvatar(character, file) {
    setError('');
    try {
      const image = await resizeImage(file);
      if (user) await api.saveAvatar(character, image);
      apply({ ...avatars, [character]: image });
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAvatar(character) {
    setError('');
    try {
      if (user) await api.deleteAvatar(character);
      apply({ ...avatars, [character]: null });
    } catch (err) {
      setError(err.message);
    }
  }

  return { avatars, setAvatar, removeAvatar, error };
}
