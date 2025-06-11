// profanity.js
import { Filter } from "bad-words";
import { SUPABASE } from "../config/config";

const filter = new Filter();

export function isProfaneUsername(username) {
  const lower = username.toLowerCase();
  const stripped = lower.replace(/[0-9_]+/g, "");

  if (filter.isProfane(lower)) return true;
  if (filter.isProfane(stripped)) return true;

  const parts = lower.split(/[\d_]+/);
  for (const part of parts) {
    if (filter.isProfane(part)) return true;
  }

  return false;
}

export async function isUsernameCleanServerSide(username) {
  const { data, error } = await SUPABASE.rpc("check_username_clean", { username });

  if (error) {
    console.error("Server profanity check failed:", error);
    return false; // fallback to blocking if there's an issue
  }

  return data === true;
}
