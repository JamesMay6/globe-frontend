// hooks/useSuperClickUpgrade.js
import { useState } from "react";
import { upgradeSuperClick } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useSuperClickUpgrade(onSuccess) {
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const data = await upgradeSuperClick();
      if (data.error) {
        showMessage(data.error || "Upgrade failed", "error");
      } else {
        showMessage(data.message || "Upgrade successful!");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      showMessage("Upgrade failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return { loading, upgrade };
}