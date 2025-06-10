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
              An interactive globe-based experience where users can delete parts of the world map one grid cell at a time. 
            </p>
            <p>
            Sign up for free, purchase clicks and start deleting and compete against others to be at the top!</p>
            <br />
            <h3>Delete the Earth Coin - Coming Soon</h3>
            <p>
              As part of deleting the earth, you will be rewarded with DTE (Delete The Earth) coin so the more you delete, the more rewards you get!
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