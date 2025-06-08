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
export async function buyClicks(amount) {
  const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
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
  const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
  const res = await fetch(`${API_URL}/profile/upgrade-super-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upgrade failed");
  return data;
}

export async function deleteEarth(lat, lon, superClick) {
  const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
  const res = await fetch(`${API_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lat, lon, superClick }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete Earth");
  return data;
}