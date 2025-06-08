// hooks/useBuyClicks.js
import { buyClicks } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useBuyClicks(fetchUserProfile, setCooldownMessage) {
  const handleBuyClicks = async (amount, free = false) => {
    try {
      const data = await buyClicks(amount);

      if (data.error) {
        if (data.status === 429 && amount === 200) {
          if (setCooldownMessage) setCooldownMessage(data.error);
        } else {
          showMessage(data.error || "Purchase failed", "error");
        }
        return;
      }

      if (free) {
        showMessage("Free clicks claimed!");
      } else {
        showMessage(`Purchased ${amount} clicks!`);
      }

      if (fetchUserProfile) fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Buy clicks failed", "error");
    }
  };

  return { handleBuyClicks };
}