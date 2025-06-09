// hooks/useUserProfile.js
import { useState, useEffect } from "react";
import { SUPABASE } from "../config/config";

export function useUserProfile(user) {
  const [username, setUsername] = useState("");
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicks, setSuperClicks] = useState(0);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await SUPABASE
      .from("profiles")
      .select("username, clicks_total, clicks_used, super_clicks")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return;
    }

    setUsername(data.username);
    setClicksTotal(data.clicks_total);
    setClicksUsed(data.clicks_used);
    setSuperClicks(data.super_clicks);
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

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
    fetchUserProfile,
  };
}
