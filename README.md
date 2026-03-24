# Reactive Tower Arena

> A real-time, on-chain tower shooter game powered by **Somnia Native Reactivity**. Built for the **Somnia Reactivity Mini Hackathon**.

![Somnia](https://img.shields.io/badge/Somnia-Testnet-00f0ff?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Reactivity](https://img.shields.io/badge/Reactivity-Event--Driven-ff00aa?style=flat-square)

---

## Somnia Reactivity Mini Hackathon

Welcome to Somnia Reactivity Mini Hackathon, a global, online event taking place from Feb 25th to March 20th, 2026.

The Somnia Reactivity Mini Hackathon invites developers and builders to explore Somnia Native On-chain Reactivity and build the first generation of truly reactive dApps on blockchain. Reactivity isn't just an incremental improvement, it's a paradigm shift that enables real-time, trustless and decentralised reactions without relying on external systems.

This hackathon is a chance to experiment, prototype, and showcase potential use cases of this breakthrough technology to the Web3 developer ecosystem.


### Track
There is one open track. Your project must integrate Somnia Reactivity to build a functional prototype that utilises the SDK in a meaningful way.

### Judging criteria
- **Technical Excellence** - Is the project functional, stable, and well-implemented using Reactivity SDK?
- **Real-Time UX** - Does it leverage the real time feature of Reactivity effectively?
- **Somnia Integration** - Is it Deployed on Somnia testnet?
- **Potential Impact** - Does it have potential to evolve into a real product or ecosystem contribution?

### About Somnia
Somnia is a high-performance, cost-efficient EVM-compatible Layer 1 blockchain capable of processing over 1,000,000 transactions per second (TPS) with sub-second finality. It is suitable for serving millions of users and building real-time mass-consumer applications like games, social applications, metaverses, and more, all fully on-chain.

### Links & Resources
- **Official Docs:** https://docs.somnia.network
- **Reactivity Info:** https://docs.somnia.network/developer/reactivity
- **X Profile:** https://x.com/SomniaDevs
- **Telegram community:** https://t.me/+XHq0F0JXMyhmMzM0

---

## What is Reactive Tower Arena?

A skill-based arcade shooter where gameplay, competition, and leaderboard synchronization are powered entirely by on-chain event-driven architecture.

This is not a Web2 game with blockchain storage. This is a real-time reactive on-chain gaming prototype designed to demonstrate how Somnia enables mass-consumer, real-time applications without polling or centralized backends.

### Core Gameplay Loop

1. **Aim and Shoot** — Control a cannon, aim with mouse, hold click to charge power, release to fire energy projectiles at the tower. Physics-based collision system with skill-based aiming mechanics.

2. **Destroy Towers** — Each block has HP. Damage decreases HP per hit. Combo multiplier for consecutive hits. Critical hit mechanic (12% chance, boosted by power charge) deals 3x damage.

3. **Progressive Levels** — Clear all blocks to unlock next level. Increasing tower density, HP values, movement patterns (oscillating blocks from level 3+), and speed. Difficulty scales dynamically.

4. **Submit Score On-Chain** — When a session ends, player submits final score. Smart contract validates and records. Emits `ScoreSubmitted(address player, uint256 score)`. Score becomes immutable, verifiable, and global.

---

## Real-Time Competitive Layer (The Core Innovation)

### Live Global Leaderboard
- Top 10 global players
- Global high score tracking
- Personal best

### Event-Driven Architecture

When ANY player submits a score:
- Smart contract emits `ScoreSubmitted` and `NewGlobalLeader` (if applicable)
- Frontend uses Somnia Reactivity SDK (WebSocket event subscription)
- All connected users receive the event instantly
- Leaderboard updates live across all clients

**None of this uses:**
- `setInterval()` or polling
- Backend servers
- WebSocket relay servers

Pure on-chain reactivity.

### Spectator Mode

Anyone can open the spectator page and watch live score submissions. The UI animates in real-time without a wallet connection. Demonstrates mass-consumer scalability — unlimited concurrent viewers via event subscriptions.

---

## Technical Architecture

```
+---------------------+     Events (WebSocket)     +----------------------+
|   React Frontend    | <-------------------------> |  Somnia Testnet      |
|                     |                             |  (ChainID: 50312)    |
|  - Canvas 2D Game   |     Transactions            |                      |
|  - Leaderboard      | --------------------------> |  ReactiveTowerArena  |
|  - Wallet Connect   |     (ethers.js)             |  Smart Contract      |
|  - Spectator Mode   |                             |                      |
|                     |     ScoreSubmitted --------> |  Events:             |
|  Reactivity:        |     NewGlobalLeader -------> |  GameStarted         |
|  WebSocket sub to   |     (pushed, not polled)    |  ScoreSubmitted      |
|  contract events    |                             |  NewGlobalLeader     |
+---------------------+                             +----------------------+
```

### Smart Contract Layer

**Contract:** `ReactiveTowerArena.sol`

Core Responsibilities:
- Store player high scores
- Maintain global leaderboard state (sorted top 10)
- Emit structured events
- Ensure fairness and integrity

Key Events (primary data drivers for UI):
- `GameStarted(address indexed player)`
- `ScoreSubmitted(address indexed player, uint256 score)`
- `NewGlobalLeader(address indexed player, uint256 score)`

### Frontend Layer

Built with:
- React (Vite) — component architecture
- TailwindCSS — dark arcade theme with neon accents
- Canvas API — 2D game rendering at 60fps
- Ethers.js — wallet + contract interaction
- Somnia Reactivity SDK — WebSocket event subscriptions

UI Modules:
- Wallet connection panel
- Game engine canvas (charge, aim, fire, combos, crits)
- Live leaderboard (reactive updates)
- Global leader banner (animated)
- Spectator mode (no wallet required)

---

## Reactivity Implementation

The frontend subscribes to contract events via WebSocket using Somnia's RPC:

```javascript
// useReactivity.js — No polling, pure event-driven
const wsProvider = new ethers.WebSocketProvider(SOMNIA_WS_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wsProvider);

// Subscribe — events are PUSHED by the chain
contract.on("ScoreSubmitted", (player, score) => {
  // Instantly refresh leaderboard for all connected users
  fetchLeaderboard();
});

contract.on("NewGlobalLeader", (player, score) => {
  // Animate "NEW LEADER" badge + confetti
  triggerNewLeaderAlert(player, score);
});
```

This is NOT polling. Somnia's sub-second finality combined with WebSocket event subscriptions means updates arrive within milliseconds of block confirmation.

## Deployment Order (for Somnia Reactivity)

Run in this exact order:

1. `npm run deploy:testnet` → deploys ReactiveTowerArena, note the address
2. Set `GAME_CONTRACT_ADDRESS=<address from step 1>` in `.env`
3. `npm run deploy:reactor` → deploys CannonReignReactor, note the address  
4. Set `REACTOR_CONTRACT_ADDRESS=<address from step 3>` in `.env`
5. Set `VITE_CONTRACT_ADDRESS` and `VITE_REACTOR_CONTRACT_ADDRESS` in `frontend/.env`
6. `npm run subscription:create` → creates the on-chain subscription (requires 32+ SOMI)
7. `npm run subscription:list` → verify subscription is active
8. `cd frontend && npm run dev` → start frontend

The on-chain reactor now automatically reacts to all game events — no backend required.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- STT tokens (Somnia Testnet) — get from the [faucet](https://testnet.somnia.network/)

### 1. Clone and Install

```bash
git clone <repo-url>
cd reactive-tower-arena

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Deploy Smart Contract

```bash
# Copy env file and add your private key
cp .env.example .env
# Edit .env -> add PRIVATE_KEY

# Deploy to Somnia Testnet
npm run deploy:testnet
```

Save the printed contract address.

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env -> add VITE_CONTRACT_ADDRESS=<your-deployed-address>
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Flow

1. **Connect wallet** — Click "Connect Wallet", switch to Somnia Testnet
2. **Start game** — Calls `startGame()` on-chain, initializes session
3. **Play** — Aim with mouse, hold to charge, release to fire, chain combos
4. **Submit score** — Calls `submitScore()` on-chain, score immutably recorded
5. **Open spectator page** — Watch the leaderboard update in real-time
6. **Open second wallet** — Submit a higher score from another account
7. **Watch the leaderboard** — Both the player view and spectator view update instantly via Somnia Reactivity

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Somnia Testnet (ChainID 50312) |
| Smart Contract | Solidity 0.8.20 |
| Framework | Hardhat |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Wallet | ethers.js + MetaMask |
| Reactivity | WebSocket event subscriptions (Somnia native) |
| Game Engine | HTML5 Canvas 2D |
| Effects | canvas-confetti |

---

## Smart Contract

**ReactiveTowerArena.sol** — Deployed on Somnia Testnet

### Functions
- `startGame()` — Resets current score, emits `GameStarted`
- `submitScore(uint256)` — Updates scores + leaderboard, emits `ScoreSubmitted` / `NewGlobalLeader`
- `getTopPlayers()` — Returns top 10 players with scores
- `getPlayerStats(address)` — Returns a player's high score and current score
- `resetLeaderboard()` — Owner-only reset

### Events (Reactivity-Powered)
- `GameStarted(address indexed player)`
- `ScoreSubmitted(address indexed player, uint256 score)`
- `NewGlobalLeader(address indexed player, uint256 score)`

---

## Hackathon Alignment

| Criteria | How We Deliver |
|----------|---------------|
| **Technical Excellence** | Custom Canvas game engine with charge physics, combo system, critical hits, progressive difficulty, oscillating blocks |
| **Real-time UX** | No polling — leaderboard updates pushed via Somnia on-chain events to all connected clients |
| **Native Somnia Integration** | Deployed on Somnia Testnet, uses Somnia RPC WebSocket for native reactivity |
| **Scalable Gaming** | Spectator mode supports unlimited concurrent viewers via event subscriptions |
| **Skill-Based Verification** | Score tied to hit count, combo multiplier, critical hits, and level reached |

---

## Project Structure

```
reactive-tower-arena/
├── contracts/
│   └── ReactiveTowerArena.sol    # Smart contract
├── scripts/
│   └── deploy.js                  # Deployment script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameCanvas.jsx     # Canvas 2D game engine
│   │   │   ├── Leaderboard.jsx    # Live leaderboard
│   │   │   ├── WalletConnect.jsx  # MetaMask connection
│   │   │   └── ReactivityStatus.jsx
│   │   ├── hooks/
│   │   │   ├── useContract.js     # Contract interactions
│   │   │   └── useReactivity.js   # Somnia Reactivity subscriptions
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Home page
│   │   │   ├── Game.jsx           # Game page
│   │   │   └── Spectate.jsx       # Spectator mode (no wallet)
│   │   ├── utils/
│   │   │   └── contract.js        # ABI and config
│   │   ├── App.jsx                # Main app (state + routing)
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   └── index.html
├── hardhat.config.js
├── package.json
└── README.md
```

---

Built for the Somnia Reactivity Mini Hackathon | Powered by Somnia Network
