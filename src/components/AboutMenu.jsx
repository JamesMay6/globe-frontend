import { useState } from "react";

export default function AboutMenu() {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="aboutMenu-container">
      <div className="aboutMenu-header">
        <span>Delete The Earth</span>
        <button 
          className="info-button" 
          onClick={() => setShowOverlay(true)}
          aria-label="About information"
        >
          i
        </button>
      </div>

      {showOverlay && (
        <div className="aboutOverlay" onClick={() => setShowOverlay(false)}>
          <div className="aboutOverlay-content" onClick={(e) => e.stopPropagation()}>
            <h3>About "Delete The Earth"</h3>
            <p>
            An interactive experience where users can delete parts of the world map one grid cell at a time. 
            </p>
            <p>
            Sign up for free and claim your first 5 free clicks to get started. Want to delete more? Purchase clicks to start delete more of the Earth and compete against others to be at the top!</p>
            <br />
            <h3>Delete the Earth Coin - Coming Soon</h3>
            <p>
              When you delete the Earth you will be rewarded with DTE (Delete The Earth) coin so the more you delete, the more rewards you get! 
              Rewards will be issued out on a daily schedule into your linked DTE wallet. The reward value is ... TBC
            </p>
            <div className="overlay-links">
              <a href="/terms.html" target="_blank" rel="noopener noreferrer">
                Terms & Conditions
              </a>
            </div>
            <button onClick={() => setShowOverlay(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}