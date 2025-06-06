import React, { useState } from 'react';
import { useToast } from './ToastContainer';

export default function AuthBox({ mode, setMode, onAuth }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const toast = useToast();

  const handle = () => {
    if (form.username && form.password) onAuth(form, mode).catch((e) => toast.error(e.message));
  };

  return (
    <div className={`authBox loggedOut`}>
      <h3>{mode === 'login' ? 'Log In' : 'Register'}</h3>
      <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button onClick={handle}>{mode === 'login' ? 'Log In' : 'Register'}</button>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        Switch to {mode === 'login' ? 'Register' : 'Login'}
      </button>
    </div>
  );
}