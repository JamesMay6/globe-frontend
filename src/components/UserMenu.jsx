import { useState } from "react";
import {
  isPaymentEnabled,
  BUY_CLICKS_PACKAGE_ONE,
  BUY_CLICKS_PACKAGE_TWO,
  BUY_CLICKS_PACKAGE_THREE,
  BUY_CLICKS_PACKAGE_ONE_COST,
  BUY_CLICKS_PACKAGE_TWO_COST,
  BUY_CLICKS_PACKAGE_THREE_COST,
  FREE_CLICKS
} from '../config/config';

export default function UserMenu({
  clicksTotal,
  clicksUsed,
  superClicksTotal,
  superClickEnabled,
  setSuperClickEnabled,
  handleBuyClicks,
  handleUpgradeSuperClick,
  cooldownMessage,
  buyMenuOpen,
  setBuyMenuOpen,
}) {
  
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);

  return (
    <div className="buyMenu">
      <button onClick={() => setBuyMenuOpen(!buyMenuOpen)}>
        {buyMenuOpen ? "Hide User Menu ▲" : "Show User Menu ▼"}
      </button>
      {buyMenuOpen && (
        <div className="buyContent">
          <div className="clicksAvailable">
            <div><strong>Available Clicks:</strong> {clicksTotal}</div>
            <div><strong>Clicks Used:</strong> {clicksUsed}</div>
            <div><strong>Available Super Clicks:</strong> {superClicksTotal}</div>
          </div>

          <div className="superClickToggle" style={{ marginTop: "1rem" }}>
            <label>
              <input
                type="checkbox"
                checked={superClickEnabled}
                onChange={() => setSuperClickEnabled(!superClickEnabled)}
              />
              Enable Super Click
            </label>
          </div>

          <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
            Purchase Clicks
          </div>

          <button className="freeClicksButton" onClick={() => handleBuyClicks(FREE_CLICKS, true)}>
            Claim {FREE_CLICKS} Free Clicks
          </button>

          {cooldownMessage && (
            <div style={{ color: "red", marginTop: "0.5rem" }}>{cooldownMessage}</div>
          )}

          {!isPaymentEnabled && (
            <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
              Paid clicks coming soon
            </div>
          )}

          {[{ clicks: BUY_CLICKS_PACKAGE_ONE, price: BUY_CLICKS_PACKAGE_ONE_COST }, 
            { clicks: BUY_CLICKS_PACKAGE_TWO, price: BUY_CLICKS_PACKAGE_TWO_COST }, 
            { clicks: BUY_CLICKS_PACKAGE_THREE, price: BUY_CLICKS_PACKAGE_THREE_COST }]
            .map(({ clicks, price }) => (
              <button
                key={clicks}
                onClick={() => {handleBuyClicks(clicks)}}
                disabled={!isPaymentEnabled}
              >
                Buy {clicks.toLocaleString()} (£{price}) 
              </button>
            ))
          }

          <div className="upgradesMenu">
            <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
              Upgrade Clicks - Delete More!
            </div>
            <div className="upgrade-button-container">
              <button onClick={handleUpgradeSuperClick} className="superClickButton">
                Upgrade to a Super Click
              </button>
              <button 
                className="upgrade-info-button" 
                onClick={() => setShowUpgradeOverlay(true)}
                aria-label="Upgrade information"
              >
                i
              </button>
            </div>

            {showUpgradeOverlay && (
              <div className="upgradeOverlay" onClick={() => setShowUpgradeOverlay(false)}>
                <div className="upgradeOverlay-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Super Click Upgrade</h2>
                  <p>
                    Use 75 clicks to get 1 Super Click which deletes up to 289 coordinates at once
                  </p>
                  <button onClick={() => setShowUpgradeOverlay(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
