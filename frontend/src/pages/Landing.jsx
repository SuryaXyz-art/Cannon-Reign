import { useEffect, useState } from "react";
import WalletConnect from "../components/WalletConnect";
import Leaderboard from "../components/Leaderboard";
import ReactivityStatus from "../components/ReactivityStatus";

export default function Landing({
    account,
    isConnecting,
    error,
    onConnect,
    topPlayers,
    globalLeader,
    newLeaderAlert,
    reactivityConnected,
    reactivityError,
    onNavigateToGame,
    onNavigateToSpectate,
}) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const pts = [];
        for (let i = 0; i < 30; i++) {
            pts.push({
                left: Math.random() * 100,
                top: Math.random() * 100,
                delay: Math.random() * 5,
                duration: 3 + Math.random() * 4,
                size: 2 + Math.random() * 3,
            });
        }
        setParticles(pts);
    }, []);

    return (
        <div className="min-h-screen bg-dark-bg bg-grid relative overflow-hidden">
            {/* Floating particles */}
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full opacity-20"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                        background: i % 2 === 0 ? "#00f0ff" : "#ff00aa",
                        animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    }}
                />
            ))}

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-neon-cyan/10">
                <div className="font-orbitron text-neon-cyan text-lg tracking-widest">
                    RTA
                </div>
                <WalletConnect
                    account={account}
                    isConnecting={isConnecting}
                    error={error}
                    onConnect={onConnect}
                />
            </header>

            {/* Main content */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <section className="text-center mb-16">
                    <h1 className="font-orbitron text-5xl md:text-7xl font-black text-glow mb-4 tracking-wider">
                        REACTIVE<br />
                        <span className="text-neon-magenta text-glow-magenta">TOWER</span>{" "}
                        <span className="text-neon-yellow text-glow-yellow">ARENA</span>
                    </h1>
                    <p className="font-inter text-gray-400 text-lg max-w-xl mx-auto mb-2">
                        A real-time on-chain tower shooter powered by{" "}
                        <span className="text-neon-cyan">Somnia Reactivity</span>
                    </p>
                    <p className="font-inter text-gray-600 text-sm mb-8">
                        No polling. No refresh. Pure event-driven gameplay.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {account ? (
                            <button
                                onClick={onNavigateToGame}
                                className="btn-neon btn-filled text-lg px-12 py-4 animate-glow-pulse"
                            >
                                ENTER ARENA
                            </button>
                        ) : (
                            <button
                                onClick={onConnect}
                                disabled={isConnecting}
                                className="btn-neon btn-filled text-lg px-12 py-4"
                            >
                                CONNECT WALLET TO PLAY
                            </button>
                        )}
                        <button
                            onClick={onNavigateToSpectate}
                            className="btn-neon text-sm px-6 py-3"
                        >
                            SPECTATE LIVE
                        </button>
                    </div>

                    {/* Reactivity status */}
                    <div className="mt-6 flex justify-center">
                        <ReactivityStatus
                            connected={reactivityConnected}
                            error={reactivityError}
                        />
                    </div>
                </section>

                {/* Features + Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Features */}
                    <section>
                        <h2 className="font-orbitron text-neon-cyan text-sm tracking-widest mb-6 uppercase">
                            How It Works
                        </h2>
                        <div className="space-y-4">
                            {[
                                {
                                    icon: "01",
                                    title: "Aim & Shoot",
                                    desc: "Control a cannon, aim with your mouse, hold to charge power, and release to fire energy projectiles at the tower.",
                                },
                                {
                                    icon: "02",
                                    title: "Destroy Towers",
                                    desc: "Each block has HP. Chain hits for combo multipliers. Land critical hits for bonus damage. Clear all blocks to level up.",
                                },
                                {
                                    icon: "03",
                                    title: "Submit On-Chain",
                                    desc: "Your score is recorded on the Somnia blockchain. Immutable, verifiable, and global — tied to your hits and combos.",
                                },
                                {
                                    icon: "04",
                                    title: "Real-Time Leaderboard",
                                    desc: "Powered by Somnia Reactivity. All players see updates instantly via on-chain events. No polling, no backend.",
                                },
                            ].map((f, i) => (
                                <div
                                    key={i}
                                    className="glass-panel-solid p-4 flex items-start gap-4 animate-slide-up"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <span className="font-orbitron text-neon-cyan text-lg font-bold min-w-[32px]">
                                        {f.icon}
                                    </span>
                                    <div>
                                        <h3 className="font-orbitron text-white text-sm mb-1">{f.title}</h3>
                                        <p className="font-inter text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tech badges */}
                        <div className="flex flex-wrap gap-2 mt-6">
                            {["Somnia Testnet", "Reactivity SDK", "Solidity", "React", "Canvas 2D"].map(
                                (badge) => (
                                    <span
                                        key={badge}
                                        className="px-3 py-1 text-xs font-orbitron text-neon-cyan border border-neon-cyan/20 rounded-full bg-neon-cyan/5"
                                    >
                                        {badge}
                                    </span>
                                )
                            )}
                        </div>
                    </section>

                    {/* Leaderboard */}
                    <section>
                        <Leaderboard
                            topPlayers={topPlayers}
                            globalLeader={globalLeader}
                            newLeaderAlert={newLeaderAlert}
                        />
                    </section>
                </div>

                {/* Footer */}
                <footer className="text-center mt-16 pt-8 border-t border-gray-800">
                    <p className="text-gray-600 text-xs font-inter">
                        Built for Somnia Reactivity Mini Hackathon | Powered by{" "}
                        <a
                            href="https://somnia.network"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neon-cyan hover:underline"
                        >
                            Somnia Network
                        </a>
                    </p>
                </footer>
            </main>
        </div>
    );
}
