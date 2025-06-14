import { useState } from "react";
import { Keypair } from "@solana/web3.js";
import { storeUserWallet } from "../services/api";

export function useWallet() {
  const [walletStatus, setWalletStatus] = useState("idle"); // idle | creating | error

  const createWallet = async (userId) => {
    setWalletStatus("creating");

    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const secretKey = Buffer.from(keypair.secretKey).toString("base64");

      await storeUserWallet(userId, publicKey);
      setWalletStatus("idle");

      return { publicKey, secretKey };
    } catch (err) {
      setWalletStatus("error");
      throw err;
    }
  };

  return { createWallet, walletStatus };
}
