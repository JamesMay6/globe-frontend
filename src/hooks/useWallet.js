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

    console.log("Storing wallet for user", userId, "publicKey", publicKey);

    await storeUserWallet(userId, publicKey);
    setWalletStatus("idle");

    return { publicKey, secretKey };
  } catch (err) {
    console.error("Error in createWallet:", err);
    setWalletStatus("error");
    throw err;  // rethrow to be caught in your component
  }
};

  return { createWallet, walletStatus };
}
