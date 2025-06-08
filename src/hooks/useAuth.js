import { useEffect, useState } from "react";
import { SUPABASE } from "../config/config";
import {
  fetchUserProfile,
  createUserProfile
} from "../services/api";
import { fakeEmail } from "../utils/fakeEmail";

export function useAuth(setUsername, setClicksTotal, setSuperClicksTotal, setClicksUsed) {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [skipProfileFetch, setSkipProfileFetch] = useState(false);

  const handleAuth = async (form, authMode, onSuccess, onError) => {
    const email = fakeEmail(form.username);

    try {
      if (authMode === "register") {
        setSkipProfileFetch(true);
        const { data, error } = await SUPABASE.auth.signUp({ email, password: form.password });
        if (error || !data.session) return onError?.(error?.message || "No session returned");

        setUser(data.session.user);

        try {
          await createUserProfile(data.user.id, form.username, data.session.access_token);
        } catch {
          return onError?.("Failed to create profile.");
        }

        setUsername(form.username); // Optimistic
        onSuccess?.("Registration successful!");

        const profile = await fetchUserProfile(data.session.access_token);
        setUsername(profile.username);
        setClicksTotal(profile.clicks_total);
        setSuperClicksTotal(profile.super_clicks);
        setClicksUsed(profile.clicks_used);
        localStorage.setItem("username", profile.username);

        setSkipProfileFetch(false);

      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({ email, password: form.password });
        if (error || !data.session) return onError?.(error?.message || "No session returned");

        setUser(data.session.user);
        setUsername(form.username); // Optimistic

        const profile = await fetchUserProfile(data.session.access_token);
        setUsername(profile.username);
        setClicksTotal(profile.clicks_total);
        setSuperClicksTotal(profile.super_clicks);
        setClicksUsed(profile.clicks_used);
        localStorage.setItem("username", profile.username);
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
        const profile = await fetchUserProfile(session.access_token);
        setUsername(profile.username);
        setClicksTotal(profile.clicks_total);
        setSuperClicksTotal(profile.super_clicks);
        setClicksUsed(profile.clicks_used);
        localStorage.setItem("username", profile.username);
      }
      setLoadingSession(false);
    };
    initSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = SUPABASE.auth.onAuthStateChange(async (event, session) => {
      if (session && !skipProfileFetch) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.access_token);
        setUsername(profile.username);
        setClicksTotal(profile.clicks_total);
        setSuperClicksTotal(profile.super_clicks);
        setClicksUsed(profile.clicks_used);
        localStorage.setItem("username", profile.username);
      } else if (!session) {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [skipProfileFetch]);

  return { user, handleAuth, handleLogout, loadingSession, fetchUserProfile };
}
