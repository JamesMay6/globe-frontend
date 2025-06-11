// hooks/useAuth.js
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
  const [showPassword, setShowPassword] = useState(false);

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

  const handleAuth = async (form, authMode, onSuccess, onError, setResetKey) => {
    const email = fakeEmail(form.username);

    try {
      if (authMode === "register") {
        setSkipProfileFetch(true);

        const { data: authData, error: authError } = await SUPABASE.auth.signUp({
          email,
          password: form.password,
        });

        if (authError || !authData.session) {
          onError?.(authError?.message || "Registration failed: No session returned.");
          setUser(null);
          setUserProfile(null);
          setSkipProfileFetch(false); // Reset on auth error
          setShowPassword(false); // reset on logout
          return;
        }

        try {
          const { data: profileData, error: rpcError } = await SUPABASE.rpc('create_user_profile_rpc', {
              p_user_id: authData.user.id,
              p_username: form.username
          });

          if (rpcError) {
              console.error("RPC create_user_profile_rpc error:", rpcError);
              onError?.(rpcError.message || "Failed to create profile after registration.");

              // If profile creation fails, we need to log the user out of Supabase Auth
              // to prevent a "half-registered" state.
              const { error: signOutError } = await SUPABASE.auth.signOut();
              if (signOutError) console.error("Error signing out after profile creation failure:", signOutError);

              setUser(null);
              setUserProfile(null);
              setSkipProfileFetch(false); // Reset on profile creation error
              return;
          }

          // ✅ Call reset key generator after profile creation succeeds
          const { data: resetKeyData, error: resetKeyError } = await SUPABASE.rpc('generate_reset_key', {
            p_user_id: authData.user.id
          });

          if (resetKeyError) {
            console.error("RPC generate_reset_key error:", resetKeyError);
            onError?.("Profile created, but secret reset key generation failed");

            // Sign the user out to avoid ghost accounts with no usable reset key
            const { error: signOutError } = await SUPABASE.auth.signOut();
            if (signOutError) console.error("Error signing out after reset key RPC failure:", signOutError);

            setUser(null);
            setUserProfile(null);
            return;
          }

          // Both authentication and profile creation succeeded.
          setUser(authData.session.user);
          setUserProfile(profileData); // Set the profile data returned by the RPC
          onSuccess?.("Registration successful!")
          setResetKey(resetKeyData);
          setSkipProfileFetch(false); // Reset on success

        } catch (profileCreationCatchError) {
            console.error("Unexpected error during profile RPC call:", profileCreationCatchError);
            onError?.("An unexpected error occurred during profile creation.");

            // Attempt to sign out if an unexpected error occurs during RPC call
            await SUPABASE.auth.signOut();
            setUser(null);
            setUserProfile(null);
            setSkipProfileFetch(false); // Reset on unexpected error
        }

      } else { // Login flow (signInWithPassword) - remains the same
        const { data, error } = await SUPABASE.auth.signInWithPassword({
          email,
          password: form.password,
        });

        if (error || !data.session) {
          onError?.(error?.message || "No session returned");
          setUser(null);
          setUserProfile(null);
          setShowPassword(false); // reset on logout
          return;
        }

        setUser(data.session.user);
        onSuccess?.("Login successful!");
      }
    } catch (err) { // Catch for the entire handleAuth try block
      console.error("Unexpected error during authentication or registration flow:", err);
      onError?.("An unexpected error occurred during authentication.");
      setUser(null);
      setUserProfile(null);
    }
  };

  const handleLogout = async () => {
  try {
    await SUPABASE.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }

  setUser(null);
  setUserProfile(null);
  setShowPassword(false); // reset on logout

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

  return {
  user,
  userProfile,
  loadingSession,
  loadingProfile,
  handleAuth,
  handleLogout,
  fetchUserProfile,
  showPassword,
  setShowPassword
};
}