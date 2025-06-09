// hooks/useBuyClicks.js
import { buyClicks } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useBuyClicks(fetchUserProfile, setCooldownMessage) {
  const handleBuyClicks = async (amount, free = false) => {
    try {
      const data = await buyClicks(amount);

      if (free) {
        showMessage("Free clicks claimed!");
      } else {
        showMessage(`Purchased ${amount} clicks!`);
      }

      if (fetchUserProfile) await fetchUserProfile();
    } catch (err) {
      console.error(err);

      if (err.message === "Daily Free Clicks Used") {
        showMessage("Daily free clicks already claimed", "error");
      } else if (err.message.includes("429")) {
        // You can detect rate limits or other error codes here
        if (setCooldownMessage) setCooldownMessage(err.message);
      } else {
        showMessage(err.message || "Buy clicks failed", "error");
      }
    }
  };

  return { handleBuyClicks };
}