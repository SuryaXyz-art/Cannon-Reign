import { useState, useEffect } from "react";

const RANK_LABELS = ["1ST", "2ND", "3RD"];
const RANK_COLORS = ["text-neon-yellow", "text-gray-300", "text-amber-600"];

export default function Leaderboard({
    topPlayers = [],
    globalLeader,
    newLeaderAlert,
    compact = false,
}) {
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (newLeaderAlert) {
            setShowAlert(true);
            const t = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(t);
        }
    }, [newLeaderAlert]);

    const formatAddr = (a) =>
        a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "---";

    const formatScore = (s) => {
        const n = typeof s === "bigint" ? Number(s) : Number(s || 0);
        return n.toLocaleString();
    };

    return (
        <div className="glass-panel p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-sm tracking-widest text-neon-cyan uppercase">
                    Live Leaderboard
                </h2>
                <span className="text-xs text-gray-600 font-inter">
                    Top {topPlayers.length || 10}
                </span>
            </div>

            {/* New leader alert */}
            {showAlert && newLeaderAlert && (
                <div className="mb-4 p-3 rounded-lg border border-neon-yellow/30 bg-neon-yellow/5 animate-badge-pop">
                    <div className="font-orbitron text-xs text-neon-yellow tracking-wider">
                        NEW GLOBAL LEADER
                    </div>
                    <div className="text-white text-sm font-inter mt-1">
                        {formatAddr(newLeaderAlert.player)} scored{" "}
                        <span className="text-neon-yellow font-bold">
                            {formatScore(newLeaderAlert.score)}
                        </span>
                    </div>
                </div>
            )}

            {/* Neon divider */}
            <div className="neon-divider mb-4" />

            {/* Player list */}
            {topPlayers.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-600 text-sm font-inter">
                        No scores yet
                    </div>
                    <div className="text-gray-700 text-xs mt-1 font-inter">
                        Be the first to play
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {topPlayers.map((entry, i) => {
                        const isGlobalLeader =
                            globalLeader &&
                            entry.player?.toLowerCase() === globalLeader.toLowerCase();
                        const score = formatScore(entry.score);

                        return (
                            <div
                                key={i}
                                className={`leaderboard-row flex items-center justify-between p-3 rounded-lg transition-all ${isGlobalLeader
                                        ? "bg-neon-yellow/5 border border-neon-yellow/20"
                                        : "bg-white/[0.02] hover:bg-white/[0.04]"
                                    }`}
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                {/* Rank */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <span
                                        className={`font-orbitron text-sm w-8 text-center ${RANK_COLORS[i] || "text-gray-500"
                                            }`}
                                    >
                                        {RANK_LABELS[i] || `#${i + 1}`}
                                    </span>
                                    <span
                                        className={`font-inter text-sm truncate ${isGlobalLeader ? "text-neon-yellow" : "text-gray-300"
                                            }`}
                                    >
                                        {formatAddr(entry.player)}
                                    </span>
                                    {isGlobalLeader && (
                                        <span className="text-xs font-orbitron text-neon-yellow/60 ml-1">
                                            LEADER
                                        </span>
                                    )}
                                </div>

                                {/* Score */}
                                <span
                                    className={`font-orbitron text-sm ${isGlobalLeader ? "text-neon-yellow" : "text-white"
                                        }`}
                                >
                                    {score}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
