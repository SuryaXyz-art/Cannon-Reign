import { useState, useCallback, useEffect, useRef } from "react";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Spectate from "./pages/Spectate";
import { useContract } from "./hooks/useContract";
import { useReactivity } from "./hooks/useReactivity";
import confetti from "canvas-confetti";

export default function App() {
    const [page, setPage] = useState("landing");
    const [topPlayers, setTopPlayers] = useState([]);
    const [globalLeader, setGlobalLeader] = useState(null);
    const [newLeaderAlert, setNewLeaderAlert] = useState(null);
    const [playerSkin, setPlayerSkin] = useState(0);
    const newLeaderTimerRef = useRef(null);

    const {
        account,
        isConnecting,
        error,
        connectWallet,
        startGame,
        submitScore,
        purchaseSkin,
        getTopPlayers,
        getPlayerSkin,
        getGlobalLeader,
        contract,
    } = useContract();

    // Fetch leaderboard
    const fetchLeaderboard = useCallback(async () => {
        if (!contract) return;
        try {
            const { players, scores } = await getTopPlayers();
            const entries = players.map((p, i) => ({ player: p, score: scores[i] }));
            setTopPlayers(entries);
            const { leader } = await getGlobalLeader();
            setGlobalLeader(leader);
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        }
    }, [contract, getTopPlayers, getGlobalLeader]);

    // Fetch player skin
    useEffect(() => {
        if (contract && account) {
            getPlayerSkin(account).then(s => setPlayerSkin(s)).catch(() => { });
        }
    }, [contract, account, getPlayerSkin]);

    useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

    // Reactivity handlers
    const handleScoreSubmitted = useCallback((data) => {
        console.log("[Reactivity] Score submitted:", data);
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleNewGlobalLeader = useCallback((data) => {
        console.log("[Reactivity] New global leader:", data);
        setNewLeaderAlert(data);
        setGlobalLeader(data.player);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#00f0ff", "#ff00aa", "#ffe100"] });
        if (newLeaderTimerRef.current) clearTimeout(newLeaderTimerRef.current);
        newLeaderTimerRef.current = setTimeout(() => setNewLeaderAlert(null), 5000);
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleSkinPurchased = useCallback((data) => {
        console.log("[Reactivity] Skin purchased:", data);
        if (data.player?.toLowerCase() === account?.toLowerCase()) {
            setPlayerSkin(data.tier);
        }
    }, [account]);

    const { connected: reactivityConnected, error: reactivityError } = useReactivity({
        onScoreSubmitted: handleScoreSubmitted,
        onNewGlobalLeader: handleNewGlobalLeader,
        onSkinPurchased: handleSkinPurchased,
        enabled: true,
    });

    const shared = { topPlayers, globalLeader, newLeaderAlert, reactivityConnected, reactivityError };

    return (
        <>
            {page === "landing" && (
                <Landing
                    account={account} isConnecting={isConnecting} error={error} onConnect={connectWallet}
                    {...shared}
                    onNavigateToGame={() => setPage("game")}
                    onNavigateToSpectate={() => setPage("spectate")}
                />
            )}
            {page === "game" && (
                <Game
                    account={account} startGame={startGame} submitScore={submitScore}
                    purchaseSkin={purchaseSkin} playerSkin={playerSkin}
                    {...shared}
                    onBack={() => setPage("landing")}
                />
            )}
            {page === "spectate" && (
                <Spectate {...shared} onBack={() => setPage("landing")} />
            )}
        </>
    );
}
