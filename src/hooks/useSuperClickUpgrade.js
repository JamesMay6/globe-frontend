// hooks/useSuperClickUpgrade.js
import { upgradeSuperClick } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useSuperClickUpgrade(fetchUserProfile, onSuccess) {
  async function upgrade() {
    try {
      const data = await upgradeSuperClick();
      if (data.error) {
        showMessage(data.error || "Upgrade failed", "error");
      } else {
        showMessage(data.message || "Upgrade successful!");
        if (onSuccess) onSuccess();
        if (fetchUserProfile) await fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
      showMessage("Upgrade failed", "error");
    }
  }

  return { upgrade };
}
