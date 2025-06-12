// hooks/useSuperClickUpgrade.js
import { upgradeSuperClick, upgradeUltraClick } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useSuperClickUpgrade(fetchUserProfile, onSuccess) {
  async function upgrade() {
    try {
      const data = await upgradeSuperClick();
      if (data.error) {
        showMessage(data.error || "Upgrade failed", "error");
      } else {
        showMessage(data.message || "Upgrade successful!", "success", 3000);
        if (onSuccess) onSuccess();
        if (fetchUserProfile) await fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Upgrade failed", "error");
    }
  }

  return { upgrade };
}

export function useUltraClickUpgrade(fetchUserProfile, onSuccess) {
  async function ultraUpgrade() {
    try {
      const data = await upgradeUltraClick();
      if (data.error) {
        showMessage(data.error || "Upgrade failed", "error");
      } else {
        showMessage(data.message || "Upgrade successful!", "success", 3000);
        if (onSuccess) onSuccess();
        if (fetchUserProfile) await fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Upgrade failed", "error");
    }
  }

  return { ultraUpgrade };
}