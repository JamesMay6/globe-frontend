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
  superClickEnabled,
  setSuperClickEnabled,
  handleBuyClicks,
  handleUpgradeSuperClick,
  handleUpgradeUltraClick,
  cooldownMessage,
  buyMenuOpen,
  setBuyMenuOpen,
}) {
  
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
            <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
              Upgrade to Delete More!
            </div>
            <button onClick={handleUpgradeSuperClick} className="superClickButton">
              Upgrade to a Super Click
            </button>
            <button onClick={handleUpgradeUltraClick} className="ultraClickButton">
              Upgrade to a Super Click
            </button>
            <p className="info-text">
              Delete more cordinates at once with Super and Ultra Clicks!
            </p>
            <p>Super - Use {SUPER_CLICK_UPGRADE_COST} clicks to delete up to {SUPER_CLICK_TOTAL_CELLS}</p>
            <p>Ultra - Use {ULTRA_CLICK_UPGRADE_COST} clicks to delete up to {ULTRA_CLICK_TOTAL_CELLS}</p>
          </div>
        </div>
      )}
    </div>
  );
}
