import { useEffect, useState } from "react";
import { SUPABASE } from "../config/config";
import { createUserProfile } from "../services/api";
import { fakeEmail } from "../utils/fakeEmail";

export function useAuth(fetchUserProfile) {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [skipProfileFetch, setSkipProfileFetch] = useState(false);

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

        // Fetch fresh profile
        await fetchUserProfile();

        setSkipProfileFetch(false);
      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({
          email,
          password: form.password,
        });

        if (error || !data.session)
          return onError?.(error?.message || "No session returned");

        setUser(data.session.user);

        // Fetch fresh profile
        await fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
      onError?.("Unexpected error during authentication.");
    }
  };

  const handleLogout = async () => {
    await SUPABASE.auth.signOut();
    setUser(null);
    // You can clear local storage or profile state inside useUserProfile if needed
  };

  useEffect(() => {
    const initSession = async () => {
      setLoadingSession(true);
      const {
        data: { session },
      } = await SUPABASE.auth.getSession();

      if (session) {
        setUser(session.user);
        await fetchUserProfile();
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
          await fetchUserProfile();
        } else if (!session) {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [skipProfileFetch]);

  return { user, handleAuth, handleLogout, loadingSession };
}
