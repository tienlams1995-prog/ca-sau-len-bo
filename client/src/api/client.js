/*
 * FILE: client/src/api/client.js — NƠI DUY NHẤT GỌI API BACK-END
 * ------------------------------------------------------------------
 * Mọi trang đều gọi server qua các hàm ở đây, không gọi fetch() lung tung.
 * Lợi ích: muốn đổi cách gọi (thêm header, xử lý lỗi) chỉ sửa 1 chỗ.
 *
 * request() tự động:
 *  - gắn token đăng nhập vào header Authorization
 *  - chuyển body sang JSON
 *  - nếu server trả lỗi -> ném Error với thông báo tiếng Việt từ server
 */

const TOKEN_KEY = 'casau_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* trình duyệt chặn localStorage: bỏ qua, chỉ mất đăng nhập khi tải lại trang */
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Không kết nối được server. Server đã chạy chưa?');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Lỗi ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (username, password, displayName) =>
    request('/auth/register', { method: 'POST', body: { username, password, displayName } }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  difficulties: () => request('/difficulties'),
  saveMatch: (difficultyId, result) =>
    request('/matches', {
      method: 'POST',
      body: {
        difficultyId,
        crossings: result.crossings,
        survivedMs: result.survivedMs,
        score: result.score,
      },
    }),
  myMatches: () => request('/matches/me'),
  leaderboard: (difficultyId, limit = 10) => request(`/leaderboard?difficulty=${difficultyId}&limit=${limit}`),
  userStats: (userId) => request(`/users/${userId}/stats`),
  myAvatars: () => request('/avatars/me'),
  saveAvatar: (character, image) => request(`/avatars/${character}`, { method: 'PUT', body: { image } }),
  deleteAvatar: (character) => request(`/avatars/${character}`, { method: 'DELETE' }),
};
