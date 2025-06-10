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
            <h2>About "Delete The Earth"</h2>
            <p>
              This is an interactive globe-based experience where users can delete parts of the world map one grid cell at a time. Every action is stored and shared globally in real-time. Play responsibly.
            </p>
            
            <br />
            <h3>Delete the Earth Coin</h3>
            <p>
              As part of deleting the earth, you will be reward with DTE (Delete The Earth) coin so the more you delete, the more rewards you get!
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