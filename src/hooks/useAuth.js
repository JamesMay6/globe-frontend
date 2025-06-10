import { useEffect, useState, useCallback } from "react";
import { SUPABASE } from "../config/config";
import { fakeEmail } from "../utils/fakeEmail";
import { logEvent } from "../utils/logger";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [skipProfileFetch, setSkipProfileFetch] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null);
      return null;
    }
    setLoadingProfile(true);
    logEvent("Fetching profile for User ID: ", user.id);
    try {
      const { data, error } = await SUPABASE
        .from("profiles")
        .select("username, clicks_total, clicks_used, super_clicks")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        logEvent("Error fetching profile for User ID: ", user.id, " with error: ", error);
        setUserProfile(null);
        return null;
      }
      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("Exception in fetchUserProfile:", err);
      setUserProfile(null);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  const handleAuth = async (form, authMode, onSuccess, onError) => {
    const email = fakeEmail(form.username);

    try {
      if (authMode === "register") {
        setSkipProfileFetch(true);

        const { data, error } = await SUPABASE.rpc('signup_and_create_profile', {
            p_email: email,
            p_password: form.password,
            p_username: form.username
        });

        if (error) {
            console.error("RPC signup_and_create_profile error:", error);
            setUser(null);
            setUserProfile(null);
            onError?.(error.message || "Registration failed.");
            setSkipProfileFetch(false);
            return;
        }

        const { error: setSessionError } = await SUPABASE.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
        });

        if (setSessionError) {
            console.error("Error setting session after RPC signup:", setSessionError);
            onError?.("Registration successful but failed to log you in. Please try logging in manually.");
            setUser(null);
            setUserProfile(null);
            return;
        }

        const { data: { user: currentUser } } = await SUPABASE.auth.getUser();
        if (currentUser) {
            setUser(currentUser);
        }

        onSuccess?.("Registration successful! Welcome.");
        setSkipProfileFetch(false);

      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({
          email,
          password: form.password,
        });

        if (error || !data.session) {
          onError?.(error?.message || "No session returned");
          setUser(null);
          setUserProfile(null);
          return;
        }

        setUser(data.session.user);
        onSuccess?.("Login successful!");
      }
    } catch (err) {
      console.error("Unexpected error during authentication:", err);
      onError?.("Unexpected error during authentication.");
      setUser(null);
      setUserProfile(null);
    }
  };

  const handleLogout = async () => {
    await SUPABASE.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  useEffect(() => {
    const initSession = async () => {
      setLoadingSession(true);
      const { data: { session }, error: sessionError } = await SUPABASE.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        const { data: { user: fallbackUser }, error: userError } = await SUPABASE.auth.getUser();
        if (fallbackUser) {
          setUser(fallbackUser);
        } else {
          setUser(null);
          setUserProfile(null);
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
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [skipProfileFetch]);

  useEffect(() => {
    if (user && !skipProfileFetch) {
      fetchUserProfile();
    } else if (!user) {
      setUserProfile(null);
    }
  }, [user, fetchUserProfile, skipProfileFetch]);

  return { user, userProfile, loadingSession, loadingProfile, handleAuth, handleLogout, fetchUserProfile };
}