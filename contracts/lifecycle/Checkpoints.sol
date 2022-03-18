// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibCheckpoints} from "./libraries/LibCheckpoints.sol";
import {CheckpointsBase} from "./CheckpointsBase.sol";
import {Ownable} from "./../access/Ownable.sol";

/**
 * @title Timestamp-based checkpoints management (immutable version).
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract Checkpoints is CheckpointsBase, Ownable {
    /**
     * Initialises the storage with a list of initial checkpoints.
     * @dev reverts if `checkpointIds` and `timestamps` have different lengths.
     * @dev emits a {CheckpointSet} event for each checkpoint set.
     * @param checkpointIds the checkpoint identifiers.
     * @param timestamps the checkpoint timestamps.
     */
    constructor(bytes32[] memory checkpointIds, uint256[] memory timestamps) {
        LibCheckpoints.initCheckpointsStorage(checkpointIds, timestamps);
    }
}
