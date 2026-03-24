import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// ABI for CannonReignReactor — only the functions/events we need in frontend
const REACTOR_ABI = [
  "function getPlayerReactiveStats(address player) view returns (uint256 kills, uint256 combos, uint256 level)",
  "event ReactorTriggered(address indexed player, bytes32 eventType, uint256 value)",
  "event AutoLeaderUpdate(address indexed player, uint256 score)",
  "event ComboBonusApplied(address indexed player, uint256 comboCount)",
  "event LevelProgressReacted(address indexed player, uint256 level)",
];

const SOMNIA_RPC = "https://dream-rpc.somnia.network";
const SOMNIA_WS = "wss://dream-rpc.somnia.network";

export function useOnChainReactivity(reactorAddress, playerAddress) {
  const [reactiveStats, setReactiveStats] = useState({
    kills: 0,
    combos: 0,
    level: 0,
  });
  const [recentReactions, setRecentReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reactorContract, setReactorContract] = useState(null);

  // Fetch reactive stats from reactor contract
  const fetchReactiveStats = useCallback(async (contract, address) => {
    if (!contract || !address) return;
    try {
      const stats = await contract.getPlayerReactiveStats(address);
      setReactiveStats({
        kills: stats.kills.toNumber ? stats.kills.toNumber() : Number(stats.kills),
        combos: stats.combos.toNumber ? stats.combos.toNumber() : Number(stats.combos),
        level: stats.level.toNumber ? stats.level.toNumber() : Number(stats.level),
      });
    } catch (err) {
      console.error("Failed to fetch reactive stats:", err);
    }
  }, []);

  useEffect(() => {
    if (!reactorAddress || reactorAddress === "0x0000000000000000000000000000000000000000") {
      return;
    }

    let wsProvider;
    let contract;

    const init = async () => {
      try {
        // HTTP provider for reads
        const httpProvider = new ethers.JsonRpcProvider(SOMNIA_RPC);
        contract = new ethers.Contract(reactorAddress, REACTOR_ABI, httpProvider);
        setReactorContract(contract);

        // Initial stats fetch
        if (playerAddress) {
          await fetchReactiveStats(contract, playerAddress);
        }

        // WebSocket for live reactor events
        wsProvider = new ethers.WebSocketProvider(SOMNIA_WS);
        const wsContract = new ethers.Contract(reactorAddress, REACTOR_ABI, wsProvider);

        wsContract.on("ReactorTriggered", (player, eventType, value, event) => {
          setIsConnected(true);
          setRecentReactions((prev) => [
            {
              player,
              eventType,
              value: value.toString(),
              timestamp: Date.now(),
              txHash: event?.transactionHash,
            },
            ...prev.slice(0, 9), // keep last 10
          ]);

          // Refresh stats if it's our player
          if (player.toLowerCase() === playerAddress?.toLowerCase()) {
            fetchReactiveStats(contract, player);
          }
        });

        wsContract.on("AutoLeaderUpdate", (player, score) => {
          console.log("🤖 Reactor: Auto leader update triggered for", player, "score:", score.toString());
        });

        setIsConnected(true);
        console.log("✅ On-chain reactor connection established");
      } catch (err) {
        console.error("Reactor connection failed:", err);
        setIsConnected(false);
      }
    };

    init();

    return () => {
      if (wsProvider) {
        wsProvider.destroy();
      }
    };
  }, [reactorAddress, playerAddress, fetchReactiveStats]);

  return {
    reactiveStats,
    recentReactions,
    isConnected,
    refetch: () => reactorContract && playerAddress && fetchReactiveStats(reactorContract, playerAddress),
  };
}
