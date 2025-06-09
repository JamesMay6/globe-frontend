import { buyClicks } from "../services/api";
import { showMessage } from "../utils/showMessage";
import { logEvent } from "../utils/logger";

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
      const logDetails = {
        error: err.message,
        stack: err.stack,
        context: "handleBuyClicks",
        amount,
        free,
      };

      if (err.message === "Daily Free Clicks Used") {
        logEvent("Attempted free clicks but limit reached", logDetails);
        showMessage("Daily free clicks already claimed", "error");
      } else if (err.message.includes("429")) {
        logEvent("Rate limit or cooldown error", logDetails);
        if (setCooldownMessage) setCooldownMessage(err.message);
      } else {
        logEvent("Unexpected error during click purchase", logDetails);
        showMessage(err.message || "Buy clicks failed", "error");
      }
    }
  };

  return { handleBuyClicks };
}
