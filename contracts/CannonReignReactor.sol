// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Fallback if npm package not available
abstract contract SomniaEventHandler {
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal virtual;

    // Called by Somnia validators
    function onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external {
        _onEvent(emitter, eventTopics, data);
    }
}

contract CannonReignReactor is SomniaEventHandler {
    address public gameContract;
    address public owner;
    
    // Auto-tracked on-chain by reactor (no backend needed)
    mapping(address => uint256) public reactiveKills;
    mapping(address => uint256) public reactiveCombos;
    mapping(address => uint256) public reactiveLevel;
    
    event ReactorTriggered(address indexed player, bytes32 eventType, uint256 value);
    event AutoLeaderUpdate(address indexed player, uint256 score);
    event ComboBonusApplied(address indexed player, uint256 comboCount);
    event LevelProgressReacted(address indexed player, uint256 level);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _gameContract) {
        gameContract = _gameContract;
        owner = msg.sender;
    }

    // Somnia calls this automatically when subscribed events fire
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        if (emitter != gameContract) return;

        bytes32 SCORE_SUBMITTED = keccak256("ScoreSubmitted(address,uint256,uint256,uint256,bool)");
        bytes32 NEW_LEADER = keccak256("NewGlobalLeader(address,uint256)");
        bytes32 COMBO_ACHIEVED = keccak256("ComboAchieved(address,uint256,uint256)");
        bytes32 LEVEL_COMPLETED = keccak256("LevelCompleted(address,uint256,uint256)");

        if (eventTopics.length == 0) return;

        if (eventTopics[0] == SCORE_SUBMITTED) {
            (address player, uint256 score, , , ) = abi.decode(data, (address, uint256, uint256, uint256, bool));
            reactiveKills[player]++;
            emit AutoLeaderUpdate(player, score);
            emit ReactorTriggered(player, eventTopics[0], score);
        } else if (eventTopics[0] == NEW_LEADER) {
            (address player, uint256 score) = abi.decode(data, (address, uint256));
            emit ReactorTriggered(player, eventTopics[0], score);
        } else if (eventTopics[0] == COMBO_ACHIEVED) {
            (address player, uint256 comboCount,) = abi.decode(data, (address, uint256, uint256));
            reactiveCombos[player] += comboCount;
            emit ComboBonusApplied(player, comboCount);
            emit ReactorTriggered(player, eventTopics[0], comboCount);
        } else if (eventTopics[0] == LEVEL_COMPLETED) {
            (address player, uint256 level,) = abi.decode(data, (address, uint256, uint256));
            if (level > reactiveLevel[player]) {
                reactiveLevel[player] = level;
            }
            emit LevelProgressReacted(player, level);
            emit ReactorTriggered(player, eventTopics[0], level);
        }
    }

    function updateGameContract(address _newContract) external onlyOwner {
        gameContract = _newContract;
    }

    function getPlayerReactiveStats(address player) external view returns (
        uint256 kills,
        uint256 combos,
        uint256 level
    ) {
        return (reactiveKills[player], reactiveCombos[player], reactiveLevel[player]);
    }
}
