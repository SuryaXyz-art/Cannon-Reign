const hre = require("hardhat");

async function main() {
    console.log("Deploying ReactiveTowerArena to Somnia Testnet...");

    const ReactiveTowerArena = await hre.ethers.getContractFactory(
        "ReactiveTowerArena"
    );
    const contract = await ReactiveTowerArena.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ ReactiveTowerArena deployed to: ${address}`);
    console.log(`\n📋 Copy this address to your frontend/.env file:`);
    console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
    console.log(
        `\n🔍 View on explorer: https://shannon-explorer.somnia.network/address/${address}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
