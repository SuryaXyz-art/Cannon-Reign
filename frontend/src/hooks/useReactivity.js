import { useEffect, useRef, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SOMNIA_TESTNET } from "../utils/contract";

export function useReactivity({ onScoreSubmitted, onNewGlobalLeader, onSkinPurchased, enabled = true }) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const contractRef = useRef(null);
    const reconnectRef = useRef(null);

    const connect = useCallback(() => {
        if (!enabled) return;
        try {
            const wsUrl = SOMNIA_TESTNET.wsUrl;
            if (!wsUrl) { setError("No WebSocket URL"); return; }

            const wsProvider = new ethers.WebSocketProvider(wsUrl);
            wsRef.current = wsProvider;

            const wsContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wsProvider);
            contractRef.current = wsContract;

            wsProvider.on("error", () => {
                setConnected(false);
                setError("WebSocket error");
                scheduleReconnect();
            });

            // ScoreSubmitted
            wsContract.on("ScoreSubmitted", (player, score, level, maxCombo, usedOverdrive) => {
                console.log("[Reactivity] ScoreSubmitted:", { player, score: score.toString(), level: level.toString() });
                onScoreSubmitted?.({
                    player,
                    score,
                    level: Number(level),
                    maxCombo: Number(maxCombo),
                    usedOverdrive,
                });
            });

            // NewGlobalLeader
            wsContract.on("NewGlobalLeader", (player, score) => {
                console.log("[Reactivity] NewGlobalLeader:", { player, score: score.toString() });
                onNewGlobalLeader?.({ player, score });
            });

            // SkinPurchased
            wsContract.on("SkinPurchased", (player, tier) => {
                console.log("[Reactivity] SkinPurchased:", { player, tier: Number(tier) });
                onSkinPurchased?.({ player, tier: Number(tier) });
            });

            setConnected(true);
            setError(null);
        } catch (err) {
            console.error("[Reactivity] Connection failed:", err);
            setError(err.message);
            setConnected(false);
            scheduleReconnect();
        }
    }, [enabled, onScoreSubmitted, onNewGlobalLeader, onSkinPurchased]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(() => {
            console.log("[Reactivity] Reconnecting...");
            cleanup();
            connect();
        }, 5000);
    }, [connect]);

    const cleanup = useCallback(() => {
        if (contractRef.current) {
            contractRef.current.removeAllListeners();
            contractRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.destroy?.();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            cleanup();
        };
    }, [connect, cleanup]);

    return { connected, error };
}
