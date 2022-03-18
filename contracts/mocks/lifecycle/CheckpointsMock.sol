// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibCheckpoints} from "./../../lifecycle/libraries/LibCheckpoints.sol";
import {Checkpoints} from "./../../lifecycle/Checkpoints.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract CheckpointsMock is Checkpoints {
    bytes32 public constant START_CHECKPOINTID = "START";

    constructor(bytes32[] memory checkpointIds, uint256[] memory timestamps) Checkpoints(checkpointIds, timestamps) Ownable(msg.sender) {}

    function enforceCheckpointReached(bytes32 checkpointId) external view {
        LibCheckpoints.enforceCheckpointReached(checkpointId);
    }

    function enforceCheckpointNotReached(bytes32 checkpointId) external view {
        LibCheckpoints.enforceCheckpointNotReached(checkpointId);
    }
}
