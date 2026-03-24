const hre = require("hardhat");

async function main() {
  // IMPORTANT: Replace this with your deployed ReactiveTowerArena address after deployment
  const GAME_CONTRACT_ADDRESS = process.env.GAME_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  console.log("Deploying CannonReignReactor...");
  console.log("Game contract address:", GAME_CONTRACT_ADDRESS);

  const Reactor = await hre.ethers.getContractFactory("CannonReignReactor");
  const reactor = await Reactor.deploy(GAME_CONTRACT_ADDRESS);
  await reactor.waitForDeployment();

  const address = await reactor.getAddress();
  console.log("✅ CannonReignReactor deployed to:", address);
  console.log("Save this address as REACTOR_CONTRACT_ADDRESS in your .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
