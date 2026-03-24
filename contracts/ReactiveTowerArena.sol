// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReactiveTowerArena {
    address public owner;

    // ── Player State ──
    mapping(address => uint256) public playerHighScore;
    mapping(address => uint256) public currentScore;
    mapping(address => uint256) public playerSkin;
    mapping(address => uint256) public playerMaxCombo;
    mapping(address => bool) public playerUsedOverdrive;
    mapping(address => uint256) public playerLevel;

    // ── Global State ──
    uint256 public globalHighScore;
    address public globalLeader;

    // ── Leaderboard ──
    address[] public topPlayersList;
    mapping(address => bool) public isTopPlayer;
    uint256 public constant MAX_TOP_PLAYERS = 10;

    // ── Skin Config ──
    uint256 public constant SKIN_TIERS = 5;
    uint256[5] public skinPrices = [
        1 ether,   // Bronze  - Basic glow
        2 ether,   // Silver  - Neon effect
        3 ether,   // Gold    - Flame particles
        5 ether,   // Plasma  - Animated energy core
        10 ether   // Cosmic  - Dynamic aura + trail
    ];

    string[5] public skinNames = [
        "Bronze",
        "Silver",
        "Gold",
        "Plasma",
        "Cosmic"
    ];

    // ── Events (Reactivity-Powered) ──
    event GameStarted(address indexed player);
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 level,
        uint256 maxCombo,
        bool usedOverdrive
    );
    event NewGlobalLeader(address indexed player, uint256 score);
    event SkinPurchased(address indexed player, uint256 tier);
    event ComboAchieved(address indexed player, uint256 comboCount, uint256 bonusScore);
    event LevelCompleted(address indexed player, uint256 level, uint256 timeBonus);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Core Functions ──

    function startGame() external {
        currentScore[msg.sender] = 0;
        playerMaxCombo[msg.sender] = 0;
        playerUsedOverdrive[msg.sender] = false;
        emit GameStarted(msg.sender);
    }

    function submitScore(
        uint256 score,
        uint256 level,
        uint256 maxCombo,
        bool usedOverdrive
    ) external {
        currentScore[msg.sender] = score;
        playerMaxCombo[msg.sender] = maxCombo;
        playerUsedOverdrive[msg.sender] = usedOverdrive;

        if (score > playerHighScore[msg.sender]) {
            playerHighScore[msg.sender] = score;
        }

        _updateTopPlayers(msg.sender);

        emit ScoreSubmitted(msg.sender, score, level, maxCombo, usedOverdrive);

        if (score > globalHighScore) {
            globalHighScore = score;
            globalLeader = msg.sender;
            emit NewGlobalLeader(msg.sender, score);
        }
    }

    function completeLevel(uint256 level, uint256 timeBonus) public {
        playerLevel[msg.sender] = level;
        emit LevelCompleted(msg.sender, level, timeBonus);
    }

    function reportCombo(uint256 comboCount, uint256 bonusScore) public {
        emit ComboAchieved(msg.sender, comboCount, bonusScore);
    }

    // ── Skin Purchase ──

    function purchaseSkin(uint256 tier) external payable {
        require(tier >= 1 && tier <= SKIN_TIERS, "Invalid skin tier");
        require(msg.value >= skinPrices[tier - 1], "Insufficient payment");
        require(tier > playerSkin[msg.sender], "Already own this or higher tier");

        playerSkin[msg.sender] = tier;
        emit SkinPurchased(msg.sender, tier);

        // Refund excess
        uint256 excess = msg.value - skinPrices[tier - 1];
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }

    // ── View Functions ──

    function getTopPlayers()
        external
        view
        returns (address[] memory players, uint256[] memory scores)
    {
        uint256 len = topPlayersList.length;
        players = new address[](len);
        scores = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            players[i] = topPlayersList[i];
            scores[i] = playerHighScore[topPlayersList[i]];
        }
    }

    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 highScore,
            uint256 curScore,
            uint256 skinTier,
            uint256 maxCombo,
            bool usedOverdrive
        )
    {
        highScore = playerHighScore[player];
        curScore = currentScore[player];
        skinTier = playerSkin[player];
        maxCombo = playerMaxCombo[player];
        usedOverdrive = playerUsedOverdrive[player];
    }

    function getTopPlayersCount() external view returns (uint256) {
        return topPlayersList.length;
    }

    function getPlayerSkin(address player) external view returns (uint256) {
        return playerSkin[player];
    }

    function getSkinPrice(uint256 tier) external view returns (uint256) {
        require(tier >= 1 && tier <= SKIN_TIERS, "Invalid tier");
        return skinPrices[tier - 1];
    }

    // ── Owner Functions ──

    function resetLeaderboard() external onlyOwner {
        for (uint256 i = 0; i < topPlayersList.length; i++) {
            isTopPlayer[topPlayersList[i]] = false;
        }
        delete topPlayersList;
        globalHighScore = 0;
        globalLeader = address(0);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // ── Internal ──

    function _updateTopPlayers(address player) internal {
        if (!isTopPlayer[player]) {
            if (topPlayersList.length < MAX_TOP_PLAYERS) {
                topPlayersList.push(player);
                isTopPlayer[player] = true;
            } else {
                uint256 minScore = playerHighScore[topPlayersList[0]];
                uint256 minIdx = 0;
                for (uint256 i = 1; i < topPlayersList.length; i++) {
                    if (playerHighScore[topPlayersList[i]] < minScore) {
                        minScore = playerHighScore[topPlayersList[i]];
                        minIdx = i;
                    }
                }
                if (playerHighScore[player] > minScore) {
                    isTopPlayer[topPlayersList[minIdx]] = false;
                    topPlayersList[minIdx] = player;
                    isTopPlayer[player] = true;
                }
            }
        }
        _sortTopPlayers();
    }

    function _sortTopPlayers() internal {
        uint256 len = topPlayersList.length;
        for (uint256 i = 0; i < len; i++) {
            for (uint256 j = i + 1; j < len; j++) {
                if (
                    playerHighScore[topPlayersList[j]] >
                    playerHighScore[topPlayersList[i]]
                ) {
                    address temp = topPlayersList[i];
                    topPlayersList[i] = topPlayersList[j];
                    topPlayersList[j] = temp;
                }
            }
        }
    }

    receive() external payable {}
}
