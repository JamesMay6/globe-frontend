import { useState } from "react";
import { supabase } from "../lib/supabase";
import { fakeEmail, showMessage } from "../lib/utils";

const AuthBox = ({ user, setUser }) => {
  const [username, setUsername] = useState("");

  const signIn = async () => {
    if (!username) return;
    const email = fakeEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: username });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password: username });
      if (!signUpError) {
        const { data: newData } = await supabase.auth.signInWithPassword({ email, password: username });
        setUser(newData.user);
      }
    } else {
      setUser(data.user);
    }
    showMessage("Signed in");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    showMessage("Signed out");
  };

  return (
    <div className="auth-box">
      {user ? (
        <>
          <span>Logged in as {user.email}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={signIn}>Sign In / Up</button>
        </>
      )}
    </div>
  );
};

export default AuthBox;