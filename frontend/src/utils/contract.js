import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x1128E66806605bCEf7836147C60a222CDa47cA53";

export const CONTRACT_ABI = [
    // Core
    "function startGame() external",
    "function submitScore(uint256 score, uint256 level, uint256 maxCombo, bool usedOverdrive) external",
    // Skins
    "function purchaseSkin(uint256 tier) external payable",
    "function getPlayerSkin(address player) external view returns (uint256)",
    "function getSkinPrice(uint256 tier) external view returns (uint256)",
    // View
    "function getTopPlayers() external view returns (address[] players, uint256[] scores)",
    "function getPlayerStats(address player) external view returns (uint256 highScore, uint256 curScore, uint256 skinTier, uint256 maxCombo, bool usedOverdrive)",
    "function globalHighScore() external view returns (uint256)",
    "function globalLeader() external view returns (address)",
    "function getTopPlayersCount() external view returns (uint256)",
    // Events
    "event GameStarted(address indexed player)",
    "event ScoreSubmitted(address indexed player, uint256 score, uint256 level, uint256 maxCombo, bool usedOverdrive)",
    "event NewGlobalLeader(address indexed player, uint256 score)",
    "event SkinPurchased(address indexed player, uint256 tier)",
];

export const SOMNIA_TESTNET = {
    chainId: import.meta.env.VITE_CHAIN_ID || "50312",
    chainIdHex: "0x" + (Number(import.meta.env.VITE_CHAIN_ID || 50312)).toString(16),
    rpcUrl: import.meta.env.VITE_SOMNIA_RPC_URL || "https://dream-rpc.somnia.network/",
    wsUrl: import.meta.env.VITE_SOMNIA_WS_URL || "wss://dream-rpc.somnia.network/ws",
    name: "Somnia Testnet",
    currency: { name: "STT", symbol: "STT", decimals: 18 },
    explorer: "https://shannon-explorer.somnia.network",
};

export const SKIN_NAMES = ["None", "Bronze", "Silver", "Gold", "Plasma", "Cosmic"];
export const SKIN_PRICES = ["0", "1", "2", "3", "5", "10"];
