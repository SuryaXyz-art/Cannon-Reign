import React from "react";
import { useOnChainReactivity } from "../hooks/useOnChainReactivity";

const REACTOR_ADDRESS = import.meta.env.VITE_REACTOR_CONTRACT_ADDRESS || "";

export default function ReactorPanel({ playerAddress }) {
  const { reactiveStats, recentReactions, isConnected } = useOnChainReactivity(
    REACTOR_ADDRESS,
    playerAddress
  );

  if (!REACTOR_ADDRESS) {
    return (
      <div className="reactor-panel reactor-panel--offline">
        <div className="reactor-status">
          <span className="reactor-dot reactor-dot--offline" />
          <span>On-Chain Reactor: Not Deployed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="reactor-panel">
      {/* Connection status */}
      <div className="reactor-status">
        <span className={`reactor-dot ${isConnected ? "reactor-dot--online" : "reactor-dot--offline"}`} />
        <span className="reactor-label">
          {isConnected ? "⚡ Somnia Reactor LIVE" : "Connecting to Reactor..."}
        </span>
      </div>

      {/* Reactive stats — auto-updated by on-chain reactor, no backend */}
      <div className="reactor-stats">
        <div className="reactor-stat">
          <span className="reactor-stat-label">Reactive Submissions</span>
          <span className="reactor-stat-value">{reactiveStats.kills}</span>
        </div>
        <div className="reactor-stat">
          <span className="reactor-stat-label">Reactive Combos</span>
          <span className="reactor-stat-value">{reactiveStats.combos}</span>
        </div>
        <div className="reactor-stat">
          <span className="reactor-stat-label">Reactive Level</span>
          <span className="reactor-stat-value">{reactiveStats.level}</span>
        </div>
      </div>

      {/* Live reaction feed */}
      {recentReactions.length > 0 && (
        <div className="reactor-feed">
          <div className="reactor-feed-title">Recent On-Chain Reactions</div>
          {recentReactions.slice(0, 5).map((reaction, i) => (
            <div key={i} className="reactor-feed-item">
              <span className="reactor-feed-player">
                {reaction.player.slice(0, 6)}...{reaction.player.slice(-4)}
              </span>
              <span className="reactor-feed-value">val: {reaction.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="reactor-footnote">
        State auto-updated by on-chain reactor. No backend. No polling.
      </div>
    </div>
  );
}
