import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { useAuth } from "../hooks/useAuth";
import { PublicKey } from "@solana/web3.js";

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
import { fetchLinkedWallet, storeUserWallet } from "../services/api";

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
  const [walletLinkingMode, setWalletLinkingMode] = useState("choose"); // 'choose' | 'create' | 'link'
  const [existingWalletKey, setExistingWalletKey] = useState("");
  const [linkError, setLinkError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showWalletDetails, setShowWalletDetails] = useState(null);
  const [walletViewModalOpen, setWalletViewModalOpen] = useState(false);
  const [linkedWalletAddress, setLinkedWalletAddress] = useState(null);

  
  const { createWallet, walletStatus } = useWallet();
  const { user } = useAuth();
  const userId = user?.id;

  const resetWalletLinkState = () => {
      setLinkError(null);
      setMessage(null);
      setShowWalletDetails(null);
      setExistingWalletKey("");
    };

  const handleCreateWallet = async () => {
    if (!userId) {
      setLinkError("You must be logged in to create a wallet.");
      return;
    }
    //console.log("userId at wallet creation:", userId);

    try {
      const { publicKey, secretKey } = await createWallet(userId);
      setMessage("Wallet Created Succesfully. \n");
      setShowWalletDetails("Wallet Address:\n" + publicKey + "\n\nSecret Key:\n" + secretKey );
      setWalletLinked(true);
      setLinkedWalletAddress(publicKey);
      //setWalletLinkingModalOpen(false);keep open
    } catch {
      setLinkError("Failed to create wallet. Please try again.");
    }
  };

const handleLinkWallet = async () => {
  try {
    const publicKey = new PublicKey(existingWalletKey); // validate public key format

    if (!userId) {
      alert("You must be logged in to link a wallet.");
      return;
    }

    await storeUserWallet(userId, publicKey.toString());  // store in backend

    setMessage("Wallet linked successfully");
    setWalletLinked(true);
    //setWalletLinkingModalOpen(false); keep open
    setLinkError(null);
  } catch (error) {
    setLinkError(error.message || "Invalid Solana wallet address");
  }
};

useEffect(() => {
  const checkWallet = async () => {
    if (!userId) {
      setWalletLinked(false);
      setLinkedWalletAddress(null);
      return;
    }

    const walletAddress = await fetchLinkedWallet(userId);

    if (walletAddress) {
      setWalletLinked(true);
      setLinkedWalletAddress(walletAddress);
    } else {
      setWalletLinked(false);
      setLinkedWalletAddress(null);
    }
  };

  checkWallet();
}, [userId]);

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
              <span>Earn DTE</span>
              <button className="info-button" onClick={() => setWalletInfoModalOpen(true)}>i</button>
            </div>

           <button
            className={`walletLinkButton ${walletLinked ? 'linked' : ''}`}
            onClick={() => {
              if (!walletLinked) {
                setWalletLinkingModalOpen(true);
              } else {
                setWalletViewModalOpen(true); // <--- NEW BEHAVIOR
              }
            }}
          >
            {walletLinked ? "Wallet Linked" : "Link Wallet"}
          </button>
          </div>

          {/* Modal for showing infomration on DTE Wallet*/}
          {walletInfoModalOpen && (
            <div className="modal-overlay" onClick={() => setWalletInfoModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>What is DTE?</h2>
                <p>Delete The Earth 'DTE' Token is the crypto token designed to reward you for your gaming.</p>
                <p>The DTE token will be issued on the Solana Network to your SOL Wallet. Keep Clicking and Earning! </p>
                <p>You can create a new SOL Wallet or link your exsiting wallet for now, but rewards are coming soon </p>
                <button onClick={() => setWalletInfoModalOpen(false)} className="close-button">Close</button>
              </div>
            </div>
          )}

          {/* Modal for showing Wallet Address when linked*/}
          {walletViewModalOpen && (
            <div className="modal-overlay" onClick={() => setWalletViewModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Wallet Linked</h2>
                <p>This is your SOL Address:</p>
                <p style={{ fontFamily: "monospace", wordBreak: "break-word" }}>
                  {linkedWalletAddress || "Unknown"}
                </p>
                <p><strong>Note:</strong> Your secret key was only shown at wallet creation time and is not stored.</p>
                <button onClick={() => setWalletViewModalOpen(false)} className="close-button">Close</button>
              </div>
            </div>
          )}
            
          {/* Modal for showing options to choose to link or creatre walletd*/}
          {walletLinkingModalOpen && (
            <div className="modal-overlay" onClick={() => {resetWalletLinkState();setWalletLinkingModalOpen(false);}}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>

                {walletLinkingMode === "choose" && (
                  <>
                    <h2>Link or Create Your Wallet Address</h2>
                    <p>The DTE Token is the rewards you earn from your clicks, running on the SOL network.</p>
                    <p>You can link your SOL Wallet Address now but rewards are coming soon </p>
                    <p>Please choose an option:</p>
                    <button onClick={() => {resetWalletLinkState(); setWalletLinkingMode("create");}} className="link-button">Create New Wallet</button>
                    <button onClick={() => {resetWalletLinkState(); setWalletLinkingMode("link");}} className="link-button">Link Existing Wallet</button>
                    <button onClick={() => {resetWalletLinkState(); setWalletLinkingModalOpen(false)}} className="close-button">Cancel</button>
                  </>
                )}

          
                {/* Modal for showing Create Wallet*/}
                {walletLinkingMode === "create" && (
                  <>
                    <h2>Create Your Wallet</h2>
                    <p>This will generate your SOL Wallet Address and show you the secret key. You can use this wallet in any Solana-compatible app like <a href="https://phantom.app" target="_blank">Phantom</a>.</p>
                    <p><strong>Important:</strong> Your secret key will <strong style={{color: "red" }}>only be shown once</strong>. Ensure you store this securely</p>
                    {linkError && <p style={{ fontWeight:"bold", color: "red" }}>{linkError}</p>} 
                    {message && <p style={{ fontSize: "18px", fontWeight:"bold", color: "green" }}>{message}</p>}
                    {showWalletDetails && (
                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {showWalletDetails}
                      </p>
                    )}
                     {!walletLinked && !showWalletDetails && (
                        <button disabled={walletLinked} onClick={handleCreateWallet} className="link-button">Create Wallet</button>
                      )}
                    {walletLinked ? (
                      <button onClick={() => {resetWalletLinkState(); setWalletLinkingModalOpen(false);}} className="close-button">Close</button>
                    ) : (
                      <button onClick={() => {resetWalletLinkState(); setWalletLinkingMode("choose")}} className="close-button">Back</button>
                    )}
                  </>
                )}

                {/* Modal for showing Link Wallet*/}
                {walletLinkingMode === "link" && (
                  <>
                    <h2>Link Existing  Wallet</h2>
                    <p>Enter your SOL wallet's <strong>public key</strong> (wallet address):</p>
                        {/* Only show input and button if wallet NOT linked yet */}
                    {!walletLinked && !message && (
                      <>
                        <input
                          type="text"
                          value={existingWalletKey}
                          onChange={(e) => setExistingWalletKey(e.target.value)}
                          placeholder="Enter your public key here"
                          style={{ width: "100%" }}
                        />
                        <button disabled={walletLinked} onClick={handleLinkWallet} className="link-button">
                          Link Wallet
                        </button>
                      </>
                    )}
                    {linkError && <p style={{ fontWeight:"bold", color: "red" }}>{linkError}</p>}
                    {message && <p style={{ fontWeight:"bold", color: "green" }}>{message}</p>}
                    {walletLinked ? (
                        <button onClick={() => {resetWalletLinkState();setWalletLinkingModalOpen(false);}} className="close-button">Close</button>
                      ) : (
                        <button onClick={() => {resetWalletLinkState();setWalletLinkingMode("choose");}} className="close-button">Back</button>
                      )}
                  </>
                )}

              </div>
            </div>
          )}
            
        </div>
      )}
    </div>
  );
}
