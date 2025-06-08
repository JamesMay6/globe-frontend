// hooks/useAuth.js
import { useEffect, useState } from "react";
import { SUPABASE, API_URL } from "../config/config";

export function useAuth(setUsername, setClicksTotal, setSuperClicksTotal) {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

const fakeEmail = (username) =>
  `${encodeURIComponent(username.toLowerCase().replace(/\s+/g, "_"))}@delete.theearth`;

  const fetchUserProfile = async (token) => {
    const accessToken = token || (await SUPABASE.auth.getSession()).data?.session?.access_token;
    if (!accessToken) return;

    const res = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    setUsername(data.username);
    localStorage.setItem("username", data.username);
    setClicksTotal(data.clicks_total);
    setSuperClicksTotal(data.super_clicks);
  };

  const handleAuth = async (form, authMode, onSuccess, onError) => {
    const email = fakeEmail(form.username);

    try {
      if (authMode === "register") {
        const { data, error } = await SUPABASE.auth.signUp({ email, password: form.password });
        if (error || !data.session) return onError?.(error?.message || "No session returned");

        setUser(data.session.user);

        // First, create the profile
        const createRes = await fetch(`${API_URL}/create-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ id: data.user.id, username: form.username }),
        });

        if (!createRes.ok) return onError?.("Failed to create profile.");

        // Now fetch profile data after creation
        setUsername(form.username); // optimistic update to avoid blank
        onSuccess?.("Registration successful!");
        await fetchUserProfile(data.session.access_token);

      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({ email, password: form.password });
        if (error || !data.session) return onError?.(error?.message || "No session returned");
        setUser(data.session.user);
        setUsername(form.username); // optimistic update to avoid blank
        await fetchUserProfile(data.session.access_token);
      }
    } catch (err) {
      console.error(err);
      onError?.("Unexpected error during authentication.");
    }
  };

  const handleLogout = async () => {
    await SUPABASE.auth.signOut();
    setUser(null);
    setUsername(null);
    localStorage.removeItem("username");
  };

  useEffect(() => {
    const initSession = async () => {
      setLoadingSession(true);
      const { data: { session } } = await SUPABASE.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      }
      setLoadingSession(false);
    };

    const { data: authListener } = SUPABASE.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      } else {
        setUser(null);
      }
    });

    initSession();
    return () => authListener.subscription.unsubscribe();
  }, []);

  return { user, handleAuth, handleLogout, loadingSession, fetchUserProfile  };
}
