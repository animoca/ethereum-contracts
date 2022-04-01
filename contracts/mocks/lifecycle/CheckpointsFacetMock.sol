// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {CheckpointsStorage} from "./../../lifecycle/libraries/CheckpointsStorage.sol";
import {CheckpointsFacet} from "./../../lifecycle/CheckpointsFacet.sol";

contract CheckpointsFacetMock is CheckpointsFacet {
    using CheckpointsStorage for CheckpointsStorage.Layout;

    bytes32 public constant START_CHECKPOINTID = "START";

    function enforceCheckpointReached(bytes32 checkpointId) external view {
        CheckpointsStorage.layout().enforceCheckpointReached(checkpointId);
    }

    function enforceCheckpointNotReached(bytes32 checkpointId) external view {
        CheckpointsStorage.layout().enforceCheckpointNotReached(checkpointId);
    }
}
