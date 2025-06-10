// hooks/useAuth.js
import { useEffect, useState, useCallback } from "react";
import { SUPABASE } from "../config/config";
import { createUserProfile } from "../services/api";
import { fakeEmail } from "../utils/fakeEmail";
import { logEvent } from "../utils/logger";

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
      const { data: authData, error: authError } = await SUPABASE.auth.signUp({
        email,
        password: form.password,
      });

      if (authError || !authData.session) {
        onError?.(authError?.message || "Registration failed: No session returned.");
        setUser(null);
        return;
      }
      try {
        await createUserProfile(authData.user.id, form.username, authData.session.access_token);
        setUser(authData.session.user);
        onSuccess?.("Registration successful! Welcome.");
      } catch (profileCreationError) {
        console.error("Error creating user profile:", profileCreationError);
        onError?.("Failed to create profile. Please try again.");

        const { error: deleteUserError } = await SUPABASE.auth.admin.deleteUser(authData.user.id);
        if (deleteUserError) {
            console.error("Failed to delete user after profile creation error:", deleteUserError);
            onError?.("Failed to create profile and could not clean up account. Please contact support.");
        }

        setUser(null);
        return; // Exit the function after error handling
      }

    } else { 
      const { data, error } = await SUPABASE.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (error || !data.session) {
        onError?.(error?.message || "No session returned");
        setUser(null);
        return;
      }

      setUser(data.session.user);
      onSuccess?.("Login successful!");
    }
  } catch (err) {
    console.error(err);
    onError?.("Unexpected error during authentication.");
    setUser(null);
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