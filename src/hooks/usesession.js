import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const useSession = (fetchUserProfile) => {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      } else {
        setUser(null);
      }
      setLoadingSession(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.access_token);
        } else {
          setUser(null);
        }
      }
    );

    init();
    return () => authListener.subscription.unsubscribe();
  }, []);

  return { user, setUser, loadingSession };
};