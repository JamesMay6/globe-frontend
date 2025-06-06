const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch(path, token, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...opts,
  });
  if (!res.ok) throw res;
  return res.json();
}

export const api = {
  getProfile: (token) => apiFetch(`/profile`, token),
  createProfile: (token, body) => apiFetch(`/create-profile`, token, { method: 'POST', body: JSON.stringify(body) }),
  getTotals: () => apiFetch(`/total-deletions`),
  getTopUsers: () => apiFetch(`/top-users`),
  deleteAt: (token, body) => apiFetch(`/delete`, token, { method: 'POST', body: JSON.stringify(body) }),
  buyClicks: (token, body) => apiFetch(`/buy-clicks`, token, { method: 'POST', body: JSON.stringify(body) }),
  upgradeSuperClick: (token) => apiFetch(`/profile/upgrade-super-click`, token, { method: 'POST' }),
};
