// profanity.js
import { Filter } from "bad-words";
import { SUPABASE } from "../config/config";

const filter = new Filter();

let customWordsLoaded = false;

export async function loadCustomProfanityList() {
  if (customWordsLoaded) return; // Avoid reloading

  const { data, error } = await SUPABASE.from("banned_words").select("word");

  if (error) {
    console.error("Failed to load custom profanity list:", error);
    return;
  }

  const customWords = data.map((row) => row.word);
  filter.addWords(...customWords);
  customWordsLoaded = true;
}

export function isProfaneUsername(username) {
  if (!customWordsLoaded) return false; // or true to block until loaded

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
