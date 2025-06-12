// inside useUserProfile.js (likely a custom hook)
import { useEffect, useState } from "react";

export function useUserProfile(user, fetchUserProfile) {
  const [username, setUsername] = useState("");
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicks, setSuperClicks] = useState(0);
  const [ultraClicks, setUltraClicks] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);

  const updateProfileFromData = (data) => {
    if (!data) return;
    setUsername(data.username || "");
    setClicksTotal(data.clicks_total || 0);
    setClicksUsed(data.clicks_used || 0);
    setSuperClicks(data.super_clicks || 0);
    setUltraClicks(data.ultra_clicks || 0);
  };

  const loadProfile = async () => {
    const data = await fetchUserProfile();
    updateProfileFromData(data);
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile(); // re-fetch when user changes
    } else {
      // clear state on logout
      setUsername("");
      setClicksTotal(0);
      setClicksUsed(0);
      setSuperClicks(0);
      setUltraClicks(0);
    }
  }, [user]);

  return {
    username,
    clicksTotal,
    clicksUsed,
    superClicks,
    ultraClicks,
    superClickEnabled,
    setUsername,
    setClicksTotal,
    setClicksUsed,
    setSuperClicks,
    setUltraClicks,
    setSuperClickEnabled,
    updateProfileFromData,
    loadProfile,
  };
}
