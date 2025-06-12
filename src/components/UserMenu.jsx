import { useState } from "react";
import {
  isPaymentEnabled,
  BUY_CLICKS_PACKAGE_ONE,
  BUY_CLICKS_PACKAGE_TWO,
  BUY_CLICKS_PACKAGE_THREE,
  BUY_CLICKS_PACKAGE_ONE_COST,
  BUY_CLICKS_PACKAGE_TWO_COST,
  BUY_CLICKS_PACKAGE_THREE_COST,
  FREE_CLICKS,
  SUPER_CLICK_UPGRADE_COST,
  SUPER_CLICK_TOTAL_CELLS,
  ULTRA_CLICK_UPGRADE_COST,
  ULTRA_CLICK_TOTAL_CELLS
} from '../config/config';

export default function UserMenu({
  clicksTotal,
  clicksUsed,
  superClicksTotal,
  ultraClicksTotal,
  superClickEnabled,
  setSuperClickEnabled,
  ultraClickEnabled,
  setUltraClickEnabled,
  handleBuyClicks,
  handleUpgradeSuperClick,
  handleUpgradeUltraClick,
  cooldownMessage,
  buyMenuOpen,
  setBuyMenuOpen,
}) {

  const [showModal, setShowModal] = useState(false);
  
  return (
    <div className="buyMenu">
      <button onClick={() => setBuyMenuOpen(!buyMenuOpen)}>
        {buyMenuOpen ? "Hide User Menu ▲" : "Show User Menu ▼"}
      </button>
      {buyMenuOpen && (
        <div className="buyContent">
          <div className="clicksAvailable">
            <div><strong>Clicks Used:</strong> {clicksUsed}</div>
            
            <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "#999" }}>
            Available Clicks
            </div>
            <div><strong>Single Clicks:</strong> {clicksTotal}</div>
            
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
            <div><strong>Super Clicks:</strong> {superClicksTotal}</div>
            <button className="enableButtons"
              onClick={() => {
                if (!superClickEnabled) {
                  setSuperClickEnabled(true);
                  setUltraClickEnabled(false);
                } else {
                  setSuperClickEnabled(false);
                }
              }}
            >
              {superClickEnabled ? "Disable" : "Enable"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px"  }}>
            <div><strong>Ultra Clicks:</strong> {ultraClicksTotal}</div>
            <button className="enableButtons"
              onClick={() => {
                if (!ultraClickEnabled) {
                  setUltraClickEnabled(true);
                  setSuperClickEnabled(false);
                } else {
                  setUltraClickEnabled(false);
                }
              }}
            >
              {ultraClickEnabled ? "Disable" : "Enable"}
            </button>
          </div>

          <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
            Purchase Clicks
          </div>

          <button className="freeClicksButton" onClick={() => handleBuyClicks(FREE_CLICKS, true)}>
            Claim Daily Free Click
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
              <button className='buyClicksButtons'
                key={clicks}
                onClick={() => {handleBuyClicks(clicks)}}
                disabled={!isPaymentEnabled}
              >
                Buy {clicks.toLocaleString()} (£{price}) 
              </button>
            ))
          }

          <div className="upgradesMenu">
            <div className="upgradesInfo" >
              <span>Upgrade to Delete More!</span>
              <button className="info-button" onClick={() => setShowModal(true)}>
                i
              </button>
            </div>

            <button onClick={handleUpgradeSuperClick} className="superClickButton">
              Upgrade to a Super Click
            </button>
            <button onClick={handleUpgradeUltraClick} className="ultraClickButton">
              Upgrade to an Ultra Click
            </button>

            {showModal && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Click Upgrades Info</h2>
                  <p><strong>Super Click:</strong> Spend {SUPER_CLICK_UPGRADE_COST} clicks to delete up to {SUPER_CLICK_TOTAL_CELLS} coordinates.</p>
                  <p><strong>Ultra Click:</strong> Spend {ULTRA_CLICK_UPGRADE_COST} clicks to delete up to {ULTRA_CLICK_TOTAL_CELLS} coordinates.</p>
                  <p>These powerful upgrades let you make a much bigger impact with fewer manual clicks.</p>
                  <button onClick={() => setShowModal(false)} className="close-button">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
