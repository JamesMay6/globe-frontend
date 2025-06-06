  import { SUPABASE, API_URL } from "../config/config";

  // ==================== AUTH ====================
  const fakeEmail = (username) => `${username}@delete.theearth`;

  export const fetchUserProfile = async (token) => {
    const accessToken = token || (await SUPABASE.auth.getSession()).data?.session?.access_token;
    if (!accessToken) return;

    const res = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    setUsername(data.username);
    localStorage.setItem("username", data.username);
    setClicksTotal(data.clicks_total);
    setSuperClicksTotal(data.super_clicks);
  };

  export const handleAuth = async () => {
    const email = fakeEmail(form.username);
    try {
      if (authMode === "register") {
        const { data, error } = await SUPABASE.auth.signUp({ email, password: form.password });
        if (error || !data.session) return alert(error?.message || "No session returned");
        setUser(data.session.user);
        await fetchUserProfile(data.session.access_token);
        await fetch(`${API_URL}/create-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ id: data.user.id, username: form.username }),
        });
        alert("Registration successful!");
      } else {
        const { data, error } = await SUPABASE.auth.signInWithPassword({ email, password: form.password });
        if (error || !data.session) return alert(error?.message || "No session returned");
        setUser(data.session.user);
        await fetchUserProfile(data.session.access_token);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error during authentication.");
    }
  };

  export const handleLogout = async () => {
    await SUPABASE.auth.signOut();
    setUser(null);
    setUsername(null);
    localStorage.removeItem("username");
  };