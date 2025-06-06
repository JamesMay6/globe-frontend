import React from 'react';
import { PRICING_TIERS } from '../constants/config';

export default function BuyMenu({ profile, onBuy, onUpgrade, paymentEnabled }) {
  return (
    <div className="buyMenu">
      <div><strong>Clicks:</strong> {profile.clicks_total}</div>
      <div><strong>Super Clicks:</strong> {profile.super_clicks}</div>
      {PRICING_TIERS.map(({ clicks, price }) => (
        <button key={clicks} disabled={!paymentEnabled} onClick={() => onBuy(clicks)}>
          Buy {clicks.toLocaleString()} (£{price})
        </button>
      ))}
      <button onClick={onUpgrade}>Upgrade to Super Click</button>
    </div>
  );
}