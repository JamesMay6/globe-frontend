import { 
  API_URL, 
  SUPABASE,
  FREE_CLICKS,
  BUY_CLICKS_PACKAGE_ONE,
  BUY_CLICKS_PACKAGE_TWO,
  BUY_CLICKS_PACKAGE_THREE
 } from "../config/config";

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
  if (amount === FREE_CLICKS) {
  const res = await fetch(`${API_URL}/buy-clicks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  // 💳 Redirect to Stripe Checkout for paid clicks
  let packageType;
  switch (amount) {
    case BUY_CLICKS_PACKAGE_ONE:
      packageType = "small";
      break;
    case BUY_CLICKS_PACKAGE_TWO:
      packageType = "medium";
      break;
    case BUY_CLICKS_PACKAGE_THREE:
      packageType = "large";
      break;
    default:
      throw new Error("Invalid click package");
  }

  const res = await fetch(`${API_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ packageType }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error);

  // 🏁 Redirect to Stripe hosted payment page
  window.location.href = result.url;

  return {}; 
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

export async function upgradeUltraClick() {
const token = await getAuthToken();
  const res = await fetch(`${API_URL}/profile/upgrade-ultra-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upgrade failed");
  return data;
}

export async function deleteEarth(lat, lon, superClick, ultraClick) {
const token = await getAuthToken();
  const res = await fetch(`${API_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lat, lon, superClick ,ultraClick}),
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

export async function tweetUpgradedDelete(type, count, username, total, expected_total, percentage) {
  const message = `${username || "Someone"} used one ${type} Click to delete ${count} Earth coordinates. 
  \n\nTotal Earth Deleted now ${total} (${percentage?.toFixed(6) || "0"}%) #DeleteTheEarthGame #DTE 🌍`;

  await fetch("/api/tweet", {
    method: "POST",
    body: JSON.stringify({ message }),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function storeUserWallet(userId, walletAddress) {
  const { error } = await SUPABASE.rpc("store_wallet_address", {
    uid: userId,
    wallet_address: walletAddress,
  });

  if (error) {
    throw new Error("Failed to store wallet address: " + error.message);
  }
}

