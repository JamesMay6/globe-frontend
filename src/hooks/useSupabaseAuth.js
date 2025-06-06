import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { api } from '../api/api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await handleSession(session);
      else setLoading(false);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) handleSession(session);
      else { setUser(null); setProfile(null); }
    });

    init();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSession(session) {
    setUser(session.user);
    const token = session.access_token;
    const data = await api.getProfile(token);
    setProfile(data);
    setLoading(false);
  }

  return { user, profile, setProfile, loading, supabase };
}