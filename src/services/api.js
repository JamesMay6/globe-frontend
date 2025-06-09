import { API_URL, SUPABASE } from "../config/config";

//global APis
export async function fetchTotals() {
  const res = await fetch(`${API_URL}/total-deletions`);
  if (!res.ok) throw new Error("Failed to fetch totals");
  return res.json();
}

export async function fetchTopUsers() {
  const res = await fetch(`${API_URL}/top-users`);
  if (!res.ok) throw new Error("Failed to fetch top users");
  return res.json();
}

//Requires User to be logged in

async function getAuthToken() {
  const { data, error } = await SUPABASE.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

export async function buyClicks(amount) {
const token = await getAuthToken();
  const res = await fetch(`${API_URL}/buy-clicks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Purchase failed");
  return data;
}

export async function upgradeSuperClick() {
const token = await getAuthToken();
  const res = await fetch(`${API_URL}/profile/upgrade-super-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upgrade failed");
  return data;
}

export async function deleteEarth(lat, lon, z, superClick) {
const token = await getAuthToken();
  const res = await fetch(`${API_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lat, lon, z, superClick }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete Earth");
  return data;
}

export async function fetchUserProfile(token) {
  const accessToken = token || (await getAuthToken());
  const res = await fetch(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function createUserProfile(id, username, token) {
  const accessToken = token || (await getAuthToken());
  const res = await fetch(`${API_URL}/create-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id, username }),
  });
  if (!res.ok) throw new Error("Failed to create profile");
}
