// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibCheckpoints} from "./../../lifecycle/libraries/LibCheckpoints.sol";
import {CheckpointsFacet} from "./../../lifecycle/CheckpointsFacet.sol";

contract CheckpointsFacetMock is CheckpointsFacet {
    bytes32 public constant START_CHECKPOINTID = "START";

    function enforceCheckpointReached(bytes32 checkpointId) external view {
        LibCheckpoints.enforceCheckpointReached(checkpointId);
    }

    function enforceCheckpointNotReached(bytes32 checkpointId) external view {
        LibCheckpoints.enforceCheckpointNotReached(checkpointId);
    }
}
