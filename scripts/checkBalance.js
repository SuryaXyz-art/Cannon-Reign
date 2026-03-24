require("dotenv").config();
const { ethers } = require("ethers");

async function checkBalance() {
  const rpc = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network/";
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.log("No private key found.");
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Address: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} STT`);
}

checkBalance().catch(console.error);
