import { buyClicks } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useBuyClicks(fetchUserProfile, setCooldownMessage) {
  const handleBuyClicks = async (amount, free = false) => {
    try {
      const data = await buyClicks(amount);

      if (free) {
        showMessage("Daily free clicks claimed!");
      } else {
        showMessage(`Purchasing ${amount} clicks..`, "warn");
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
        showMessage("Daily free clicks already claimed", "error");
      } else if (err.message.includes("429")) {
        if (setCooldownMessage) setCooldownMessage(err.message);
      } else {
        showMessage(err.message || "Buy clicks failed", "error");
      }
    }
  };

  return { handleBuyClicks };
}
