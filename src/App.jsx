import React, { useState } from 'react';
import AuthBox from './components/AuthBox';
import BuyMenu from './components/BuyMenu';
import StatsPanel from './components/StatsPanel';
import Leaderboard from './components/Leaderboard';
import CesiumCanvas from './components/CesiumCanvas';
import ToastContainer, { useToast } from './components/ToastContainer';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { api } from './api/api';

export default function App() {
  const { user, profile, setProfile, supabase, loading } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState('login');
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const toast = useToast();

  const handleAuth = async ({ username, password }, mode) => {
    const fakeEmail = `${username}@delete.theearth`;
    const action = mode === 'register'
      ? supabase.auth.signUp({ email: fakeEmail, password })
      : supabase.auth.signInWithPassword({ email: fakeEmail, password });
    const { data, error } = await action;
    if (error) throw new Error(error.message);
    if (mode === 'register') {
      const session = data.session;
      await api.createProfile(session.access_token, { id: session.user.id, username });
    }
  };

  const handleBuy = async (amount) => {
    const token = (await supabase.auth.getSession()).data.session.access_token;
    const updated = await api.buyClicks(token, { amount });
    toast.success(`Purchased ${amount.toLocaleString()} clicks`);
    setProfile(updated);
  };

  const handleUpgrade = async () => {
    const token = (await supabase.auth.getSession()).data.session.access_token;
    const updated = await api.upgradeSuperClick(token);
    toast.success('Super Click upgraded 🤘');
    setProfile(updated);
  };

  if (loading) return <div>Loading…</div>;

  return (
    <>
      <ToastContainer />
      {!user ? (
        <AuthBox mode={authMode} setMode={setAuthMode} onAuth={handleAuth} />
      ) : (
        <>
          <BuyMenu profile={profile} onBuy={handleBuy} onUpgrade={handleUpgrade} paymentEnabled={import.meta.env.VITE_PAYMENT_ENABLED === 'true'} />
          <button onClick={() => setStatsOpen(!statsOpen)}>
            {statsOpen ? 'Hide Stats' : 'Show Stats'}
          </button>
          {statsOpen && <StatsPanel totals={profile.totals} />}
          <button onClick={() => setLeaderboardOpen(!leaderboardOpen)}>
            {leaderboardOpen ? 'Hide Leaderboard' : 'Show Leaderboard'}
          </button>
          {leaderboardOpen && <Leaderboard topUsers={profile.top_users} />}
        </>
      )}
      <CesiumCanvas user={user} profile={profile} setProfile={setProfile} />
    </>
  );
}