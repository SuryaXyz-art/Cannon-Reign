import Leaderboard from "../components/Leaderboard";
import ReactivityStatus from "../components/ReactivityStatus";

export default function Spectate({
    topPlayers,
    globalLeader,
    newLeaderAlert,
    reactivityConnected,
    reactivityError,
    onBack,
}) {
    return (
        <div className="min-h-screen bg-dark-bg bg-grid">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-neon-cyan/10">
                <button
                    onClick={onBack}
                    className="font-orbitron text-sm text-gray-500 hover:text-neon-cyan transition-colors"
                >
                    BACK
                </button>
                <div className="font-orbitron text-neon-cyan text-sm tracking-widest">
                    SPECTATOR MODE
                </div>
                <ReactivityStatus
                    connected={reactivityConnected}
                    error={reactivityError}
                />
            </header>

            {/* Main */}
            <main className="max-w-2xl mx-auto px-4 py-10">
                <div className="text-center mb-8">
                    <h1 className="font-orbitron text-3xl font-bold text-glow mb-2">
                        LIVE ARENA
                    </h1>
                    <p className="text-gray-500 text-sm font-inter">
                        Watch the leaderboard update in real-time via Somnia Reactivity.
                        <br />
                        No wallet required. Pure event-driven spectating.
                    </p>
                </div>

                {/* Connection status */}
                <div className="flex justify-center mb-6">
                    <div className={`px-4 py-2 rounded-lg text-sm font-inter ${reactivityConnected
                            ? "bg-neon-green/5 border border-neon-green/20 text-neon-green"
                            : "bg-neon-yellow/5 border border-neon-yellow/20 text-neon-yellow"
                        }`}>
                        {reactivityConnected
                            ? "Connected to Somnia event stream — live updates active"
                            : "Connecting to Somnia event stream..."}
                    </div>
                </div>

                {/* Live leaderboard */}
                <Leaderboard
                    topPlayers={topPlayers}
                    globalLeader={globalLeader}
                    newLeaderAlert={newLeaderAlert}
                />

                {/* Explanation */}
                <div className="mt-8 glass-panel-solid p-5">
                    <h3 className="font-orbitron text-xs text-neon-cyan tracking-widest mb-3">
                        WHAT YOU ARE SEEING
                    </h3>
                    <div className="space-y-3 text-xs font-inter text-gray-400 leading-relaxed">
                        <p>
                            This page subscribes to on-chain events from the ReactiveTowerArena
                            smart contract deployed on Somnia Testnet. When any player submits
                            a score, an event is emitted on-chain and pushed to all connected
                            clients via WebSocket.
                        </p>
                        <p>
                            There is no backend, no polling interval, and no centralized server.
                            This leaderboard is powered entirely by Somnia's native reactivity
                            infrastructure.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 text-[10px] font-orbitron text-neon-cyan border border-neon-cyan/20 rounded bg-neon-cyan/5">
                                ScoreSubmitted event
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-orbitron text-neon-magenta border border-neon-magenta/20 rounded bg-neon-magenta/5">
                                NewGlobalLeader event
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-orbitron text-neon-yellow border border-neon-yellow/20 rounded bg-neon-yellow/5">
                                WebSocket push
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
