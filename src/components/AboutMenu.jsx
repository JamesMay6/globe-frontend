import { useState } from "react";

export default function AboutMenu({
    aboutMenuOpen,
    setAboutMenuOpen
    }) {

  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="aboutMenu-container">
      <div className="aboutMenu-header" onClick={() => setAboutMenuOpen(!aboutMenuOpen)}>
        {aboutMenuOpen ? "Delete The Earth ▲" : "Delete The Earth ▼"}
      </div>

      {aboutMenuOpen && (
        <div className="aboutMenu-content">
          <button onClick={() => setShowOverlay(true)}>About</button>
          <a href="/T&Cs.html" target="_blank" rel="noopener noreferrer">
            Terms & Conditions
          </a>
        </div>
      )}

      {showOverlay && (
        <div className="aboutOverlay" onClick={() => setShowOverlay(false)}>
          <div className="aboutOverlay-content" onClick={(e) => e.stopPropagation()}>
            <h2>About "Delete The Earth"</h2>
            <p>
              This is an interactive globe-based experience where users can delete parts of the world map one grid cell at a time. Every action is stored and shared globally in real-time. Play responsibly.
            </p>
            <button onClick={() => setShowOverlay(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}