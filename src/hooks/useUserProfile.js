import { useState, useEffect } from "react";

export function useUserProfile(user, fetchUserProfile) {
  const [username, setUsername] = useState("");
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicks, setSuperClicks] = useState(0);

  const updateProfileFromData = (data) => {
    if (data) {
      setUsername(data.username);
      setClicksTotal(data.clicks_total);
      setClicksUsed(data.clicks_used);
      setSuperClicks(data.super_clicks);
    }
  };

  useEffect(() => {
    if (user && fetchUserProfile) {
      fetchUserProfile().then(updateProfileFromData);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    console.log("👤 user:", user);
    console.log("📛 username:", username);
  }, [user, username]);

  return {
    username,
    clicksTotal,
    clicksUsed,
    superClicks,
    setUsername,
    setClicksTotal,
    setClicksUsed,
    setSuperClicks,
    updateProfileFromData, // Export this for manual updates
  };
}