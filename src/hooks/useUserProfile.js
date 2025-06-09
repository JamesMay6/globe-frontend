// hooks/useUserProfile.js
import { useState, useEffect } from "react";
import { SUPABASE } from "../config/config";
import { fetchUserProfile as fetchUserProfileAPI } from "../services/api";

export function useUserProfile() {
  const [username, setUsername] = useState(null);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { session },
      } = await SUPABASE.auth.getSession();

      if (!session || !session.access_token) {
        console.warn("No valid session for fetching profile");
        return;
      }

      const profile = await fetchUserProfileAPI(session.access_token);
      setUsername(profile.username);
      setClicksTotal(profile.clicks_total);
      setClicksUsed(profile.clicks_used);
      setSuperClicksTotal(profile.super_clicks_total);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    username,
    clicksTotal,
    clicksUsed,
    superClicksTotal,
    superClickEnabled,
    setSuperClickEnabled,
    setClicksTotal,
    setClicksUsed,
    setSuperClicksTotal,
    fetchUserProfile,
  };
}
