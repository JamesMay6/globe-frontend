// services/api.js
const API_URL = import.meta.env.VITE_API_URL;

//get Access Token
export const getAccessToken = async () => {
  const { data } = await window.supabase.auth.getSession();
  return data?.session?.access_token || null;
};

//Set Up the APIs
export const authorizedFetch = async (endpoint, options = {}) => {
  const token = await getAccessToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

//Specific APIs
export const fetchUserProfile = async () => {
  const res = await authorizedFetch("/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export const createUserProfile = async (id, username) => {
  const res = await authorizedFetch("/create-profile", {
    method: "POST",
    body: JSON.stringify({ id, username }),
  });
  if (!res.ok) throw new Error(await res.text());
};

export const deleteEarth = async (lat, lon) => {
  const res = await authorizedFetch("/delete", {
    method: "POST",
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error("Failed to delete Earth");
  return res.json();
};

export const buyClicks = async (amount) => {
  const res = await authorizedFetch("/buy-clicks", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to buy clicks");
  return data;
};

export const upgradeSuperClick = async () => {
  const res = await authorizedFetch("/profile/upgrade-super-click", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to upgrade");
  return data;
};

export const fetchTotals = async () => {
  const res = await fetch(`${API_URL}/total-deletions`);
  if (!res.ok) throw new Error("Failed to fetch totals");
  return res.json();
};

export const fetchTopUsers = async () => {
  const res = await fetch(`${API_URL}/top-users`);
  if (!res.ok) throw new Error("Failed to fetch top users");
  return res.json();
};

export const fetchDeletedCells = async (minLat, maxLat, minLon, maxLon) => {
  const res = await fetch(
    `${API_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`
  );
  if (!res.ok) throw new Error("Failed to fetch deleted cells");
  return res.json();
};
