// hooks/useUserProfile.js
import { useState, useEffect, useCallback } from "react";

export function useUserProfile(user, fetchUserProfile) {
  const [username, setUsername] = useState("");
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicks, setSuperClicks] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(0);

  const updateProfileFromData = useCallback((data) => {
    console.log("📝 Updating profile state with data:", data);
    if (data) {
      setUsername(data.username || "");
      setClicksTotal(data.clicks_total || 0);
      setClicksUsed(data.clicks_used || 0);
      setSuperClicks(data.super_clicks || 0);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    if (user && fetchUserProfile) {
      console.log("🚀 Calling fetchUserProfile...");
      try {
        const data = await fetchUserProfile();
        console.log("📦 Received profile data:", data);
        updateProfileFromData(data);
      } catch (err) {
        console.error("❌ Error in profile fetch:", err);
      }
    }
  }, [user, fetchUserProfile, updateProfileFromData]);

  useEffect(() => {
    console.log("🔄 useUserProfile effect triggered, user:", user?.id, "fetchUserProfile:", !!fetchUserProfile);
    
    if (user && fetchUserProfile) {
      loadProfile();
    } else {
      console.log("⏸️ Skipping profile fetch - user:", !!user, "fetchUserProfile:", !!fetchUserProfile);
    }
  }, [user, fetchUserProfile, loadProfile]);

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
    superClickEnabled,
    setSuperClickEnabled,
    updateProfileFromData,
    loadProfile, // Export this for manual refresh
  };
}