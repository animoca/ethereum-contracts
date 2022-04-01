// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {CheckpointsStorage} from "./../../lifecycle/libraries/CheckpointsStorage.sol";
import {Checkpoints} from "./../../lifecycle/Checkpoints.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract CheckpointsMock is Checkpoints {
    using CheckpointsStorage for CheckpointsStorage.Layout;

    bytes32 public constant START_CHECKPOINTID = "START";

    constructor(bytes32[] memory checkpointIds, uint256[] memory timestamps) Checkpoints(checkpointIds, timestamps) Ownable(msg.sender) {}

    function enforceCheckpointReached(bytes32 checkpointId) external view {
        CheckpointsStorage.layout().enforceCheckpointReached(checkpointId);
    }

    function enforceCheckpointNotReached(bytes32 checkpointId) external view {
        CheckpointsStorage.layout().enforceCheckpointNotReached(checkpointId);
    }
}
