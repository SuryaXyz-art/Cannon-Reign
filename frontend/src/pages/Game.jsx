import { useState, useCallback, useRef, useEffect } from "react";
import GameCanvas from "../components/GameCanvas";
import Leaderboard from "../components/Leaderboard";
import ReactivityStatus from "../components/ReactivityStatus";
import ReactorPanel from "../components/ReactorPanel";
import { SKIN_NAMES, SKIN_PRICES } from "../utils/contract";

export default function Game({
    account,
    startGame,
    submitScore,
    purchaseSkin,
    playerSkin,
    topPlayers,
    globalLeader,
    newLeaderAlert,
    reactivityConnected,
    reactivityError,
    onBack,
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isBuyingSkin, setIsBuyingSkin] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");
    const [showSkinShop, setShowSkinShop] = useState(false);
    const gameRef = useRef(null);

    const handleStart = useCallback(async () => {
        try {
            setIsStarting(true);
            setStatusMsg("Starting game on-chain...");
            await startGame();
            setIsPlaying(true);
            setCurrentScore(0);
            setCurrentLevel(1);
            setTxHash(null);
            setStatusMsg("");
        } catch (err) {
            setStatusMsg(`Error: ${err.message || "Failed to start"}`);
        } finally {
            setIsStarting(false);
        }
    }, [startGame]);

    const handleScoreUpdate = useCallback((score) => {
        setCurrentScore(score);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (currentScore === 0) return;
        try {
            setIsSubmitting(true);
            setStatusMsg("Submitting score on-chain...");
            const tx = await submitScore(currentScore, currentLevel, 0, false);
            setTxHash(tx.hash);
            setIsPlaying(false);
            setStatusMsg("Score submitted. Check the leaderboard.");
        } catch (err) {
            setStatusMsg(`Error: ${err.message || "Failed to submit"}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentScore, currentLevel, submitScore]);

    const handleGameOver = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleBuySkin = useCallback(async (tier) => {
        try {
            setIsBuyingSkin(true);
            setStatusMsg(`Purchasing ${SKIN_NAMES[tier]} skin...`);
            await purchaseSkin(tier);
            setStatusMsg(`${SKIN_NAMES[tier]} skin purchased. Equipped.`);
        } catch (err) {
            setStatusMsg(`Error: ${err.message || "Purchase failed"}`);
        } finally {
            setIsBuyingSkin(false);
        }
    }, [purchaseSkin]);

    return (
        <div className="min-h-screen bg-dark-bg bg-grid">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-neon-cyan/10">
                <button onClick={onBack} className="font-orbitron text-sm text-gray-500 hover:text-neon-cyan transition-colors">
                    BACK
                </button>
                <div className="font-orbitron text-neon-cyan text-sm tracking-widest">
                    REACTIVE TOWER ARENA
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-inter text-xs text-gray-500">
                        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""}
                    </span>
                    {playerSkin > 0 && (
                        <span className="text-[10px] font-orbitron px-2 py-0.5 rounded border border-neon-yellow/20 text-neon-yellow bg-neon-yellow/5">
                            {SKIN_NAMES[playerSkin]}
                        </span>
                    )}
                    <ReactivityStatus connected={reactivityConnected} error={reactivityError} />
                </div>
            </header>

            {/* Main */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Game Area */}
                    <div className="xl:col-span-2 space-y-4">
                        <GameCanvas
                            ref={gameRef}
                            isPlaying={isPlaying}
                            onScoreUpdate={handleScoreUpdate}
                            onGameOver={handleGameOver}
                            skinTier={playerSkin}
                        />

                        {/* Controls */}
                        <div className="glass-panel p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 font-inter uppercase">Current Score</div>
                                    <div className="font-orbitron text-2xl text-neon-yellow text-glow-yellow">
                                        {currentScore.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {!isPlaying ? (
                                        <>
                                            <button onClick={handleStart} disabled={isStarting} className="btn-neon btn-filled">
                                                {isStarting ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                        Starting...
                                                    </span>
                                                ) : "START GAME"}
                                            </button>
                                            <button onClick={() => setShowSkinShop(!showSkinShop)} className="btn-neon text-xs">
                                                {showSkinShop ? "HIDE SKINS" : "SKIN SHOP"}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={isSubmitting || currentScore === 0} className="btn-neon btn-magenta">
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                    Submitting...
                                                </span>
                                            ) : "SUBMIT SCORE"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {statusMsg && (
                                <div className={`mt-3 text-sm font-inter ${statusMsg.startsWith("Error") ? "text-red-400" : "text-neon-cyan"}`}>
                                    {statusMsg}
                                </div>
                            )}
                            {txHash && (
                                <div className="mt-2 text-xs font-inter text-gray-500">
                                    TX: <a href={`https://shannon-explorer.somnia.network/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">{txHash.slice(0, 10)}...{txHash.slice(-8)}</a>
                                </div>
                            )}
                        </div>

                        {/* Skin Shop */}
                        {showSkinShop && (
                            <div className="glass-panel p-4 animate-slide-up">
                                <h3 className="font-orbitron text-xs text-neon-cyan tracking-widest mb-3">CANNON SKINS</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map((tier) => {
                                        const owned = playerSkin >= tier;
                                        const colors = [
                                            "border-amber-700 text-amber-600",
                                            "border-gray-400 text-gray-300",
                                            "border-yellow-400 text-yellow-300",
                                            "border-purple-400 text-purple-300",
                                            "border-emerald-400 text-emerald-300",
                                        ];
                                        return (
                                            <button
                                                key={tier}
                                                onClick={() => !owned && handleBuySkin(tier)}
                                                disabled={owned || isBuyingSkin}
                                                className={`p-3 rounded-lg border ${colors[tier - 1]} bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center ${owned ? "opacity-50" : ""}`}
                                            >
                                                <div className="font-orbitron text-xs">{SKIN_NAMES[tier]}</div>
                                                <div className="text-[10px] mt-1 text-gray-500">
                                                    {owned ? "OWNED" : `${SKIN_PRICES[tier]} STT`}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 font-inter">
                                    Skins are on-chain. Purchase triggers SkinPurchased event — all connected users see it via Reactivity.
                                </p>
                            </div>
                        )}

                        <div className="text-center text-xs text-gray-700 font-inter">
                            Powered by Somnia Reactivity — Scores, skins, and events are on-chain
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Leaderboard topPlayers={topPlayers} globalLeader={globalLeader} newLeaderAlert={newLeaderAlert} compact />

                        <ReactorPanel playerAddress={account} />

                        <div className="glass-panel-solid p-4">
                            <h3 className="font-orbitron text-xs text-neon-cyan tracking-widest mb-3">CONTROLS</h3>
                            <ul className="space-y-2 text-xs font-inter text-gray-400">
                                <li className="flex items-center gap-2">
                                    <span className="text-neon-cyan font-orbitron text-[10px] w-14">A / D</span>
                                    Move cannon left/right
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-neon-cyan font-orbitron text-[10px] w-14">MOUSE</span>
                                    Aim cannon angle
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-neon-cyan font-orbitron text-[10px] w-14">HOLD</span>
                                    Hold click to charge power
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-neon-cyan font-orbitron text-[10px] w-14">RELEASE</span>
                                    Release to fire projectile
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400 font-orbitron text-[10px] w-14">E</span>
                                    Toggle Overdrive (2x dmg, 2x heat)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-cyan-400 font-orbitron text-[10px] w-14">SPACE</span>
                                    Shield Pulse (blocks enemy balls)
                                </li>
                            </ul>
                            <div className="neon-divider my-3" />
                            <h4 className="font-orbitron text-[10px] text-gray-500 tracking-widest mb-2">SURVIVAL</h4>
                            <ul className="space-y-1 text-[10px] font-inter text-gray-500">
                                <li>ENEMY BALLS — bricks drop attack balls at cannon.</li>
                                <li>FAST (red) — quick, hard to dodge.</li>
                                <li>HEAVY (purple) — slow, costs 2 lives on hit.</li>
                                <li>SPLITTING (yellow) — breaks into 2 on intercept.</li>
                                <li>INTERCEPT — shoot enemy balls for bonus + combo.</li>
                                <li>SHIELD — SPACE to block. Has cooldown + heat cost.</li>
                                <li>MISS PENALTY — 3 misses=combo, 5=life lost.</li>
                                <li>SUDDEN DEATH — Level 10+: 1 life, 2x speed.</li>
                                <li>ADAPTIVE AI — game scales to your performance.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
