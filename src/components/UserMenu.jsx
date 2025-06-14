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
  const [walletLinked, setWalletLinked] = useState(false);
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false);
  const [walletLinkingModalOpen, setWalletLinkingModalOpen] = useState(false);
  
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

          <div style={{ marginTop: "0.7rem", marginBottom: "0.5rem", color: "#999" }}>
            Purchase Clicks
          </div>

          <button className="freeClicksButton" onClick={() => handleBuyClicks(FREE_CLICKS, true)}>
            Claim {FREE_CLICKS} Daily Free Clicks
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
              <span>Upgrade Your Clicks</span>
              <button className="info-button" onClick={() => setShowModal(true)}>
                i
              </button>
            </div>

            <button onClick={handleUpgradeSuperClick} className="superClickButton">
              Super Click: Cost {SUPER_CLICK_UPGRADE_COST}
            </button>
            <button onClick={handleUpgradeUltraClick} className="ultraClickButton">
              Ultra Click: Cost {ULTRA_CLICK_UPGRADE_COST}
            </button>

            {showModal && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Click Upgrades Info</h2>
                  <p><strong>Super Click:</strong> Spend {SUPER_CLICK_UPGRADE_COST} clicks to delete up to {SUPER_CLICK_TOTAL_CELLS} coordinates.</p>
                  <p><strong>Ultra Click:</strong> Spend {ULTRA_CLICK_UPGRADE_COST} clicks to delete up to {ULTRA_CLICK_TOTAL_CELLS} coordinates.</p>
                  <p>Once you have upgraded, enable them in the User Menu and these powerful upgrades let you make a much bigger impact with fewer manual clicks. </p>
                  <button onClick={() => setShowModal(false)} className="close-button">Close</button>
                </div>
              </div>
            )}
          </div>

          <div className="walletLinkMenu">
            <div className="walletLinkInfo" >
              <span>Link DTE Wallet</span>
              <button className="info-button" onClick={() => setWalletInfoModalOpen(true)}>i</button>
            </div>

            <button
              className={`walletLinkButton ${walletLinked ? 'linked' : ''}`}
              onClick={() => {
                if (!walletLinked) {
                  setWalletLinkingModalOpen(true);
                  // Future: setWalletLinked(true); once real linking logic succeeds
                }
              }}
              disabled={walletLinked}
            >
              {walletLinked ? "Wallet Linked" : "Link Wallet"}
            </button>
          </div>

          {walletInfoModalOpen && (
            <div className="modal-overlay" onClick={() => setWalletInfoModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>What is DTE Wallet?</h2>
                <p>Delete The Earth 'DTE' Token is the crypto token designed to reward you for your gaming.</p>
                <p>The DTE Wallet will let you store the rewards you earn from your clicks. Linking support coming soon.</p>
                <button onClick={() => setWalletInfoModalOpen(false)} className="close-button">Close</button>
              </div>
            </div>
          )}

          {walletLinkingModalOpen && (
            <div className="modal-overlay" onClick={() => setWalletLinkingModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Linking Coming Soon</h2>
                <p>You’ll soon be able to link your DTE Wallet to store the rewards you earn from your activity, so the more you click, the more Earth you delete, the more rewards you will earn!</p>
                <button onClick={() => setWalletLinkingModalOpen(false)} className="close-button">Close</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
