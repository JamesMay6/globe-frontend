// hooks/useAuth.js
import { useEffect, useState, useCallback } from "react";
import { SUPABASE } from "../config/config";
import { createUserProfile } from "../services/api";
import { fakeEmail } from "../utils/fakeEmail";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [skipProfileFetch, setSkipProfileFetch] = useState(false);

  // Use useCallback to ensure fetchUserProfile always has the latest user value
  const fetchUserProfile = useCallback(async () => {   
    if (!user?.id) {
      console.log("No user ID available");
      return null;
    }

    console.log("📡 Fetching profile for user ID:", user.id);

    try {
      const { data, error } = await SUPABASE
        .from("profiles")
        .select("username, clicks_total, clicks_used, super_clicks")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("Exception in fetchUserProfile:", err);
      return null;
    }
  }, [user]); // Depend on user so it updates when user changes

  const handleAuth = async (form, authMode, onSuccess, onError) => {
    const email = fakeEmail(form.username);

    try {
      if (authMode === "register") {
        setSkipProfileFetch(true);

        const { data, error } = await SUPABASE.auth.signUp({
          email,
          password: form.password,
        });

        if (error || !data.session)
          return onError?.(error?.message || "No session returned");

        setUser(data.session.user);

        try {
          await createUserProfile(data.user.id, form.username, data.session.access_token);
        } catch {
          return onError?.("Failed to create profile.");
        }

        onSuccess?.("Registration successful!");
        setSkipProfileFetch(false);
      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({
          email,
          password: form.password,
        });

        if (error || !data.session)
          return onError?.(error?.message || "No session returned");

        setUser(data.session.user);
      }
    } catch (err) {
      console.error(err);
      onError?.("Unexpected error during authentication.");
    }
  };

  const handleLogout = async () => {
    await SUPABASE.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const initSession = async () => {
      setLoadingSession(true);

      const {
        data: { session },
        error: sessionError,
      } = await SUPABASE.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        const {
          data: { user: fallbackUser },
          error: userError
        } = await SUPABASE.auth.getUser();

        if (fallbackUser) {
          setUser(fallbackUser);
        }
      }

      setLoadingSession(false);
    };
    initSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = SUPABASE.auth.onAuthStateChange(
      async (event, session) => {
        if (session && !skipProfileFetch) {
          setUser(session.user);
        } else if (!session) {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [skipProfileFetch]);

  return { user, handleAuth, handleLogout, loadingSession, fetchUserProfile };
}