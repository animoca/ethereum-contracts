// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {CheckpointsStorage} from "./libraries/CheckpointsStorage.sol";
import {CheckpointsBase} from "./CheckpointsBase.sol";
import {Ownable} from "./../access/Ownable.sol";

/// @title Timestamp-based checkpoints management (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract Checkpoints is CheckpointsBase, Ownable {
    using CheckpointsStorage for CheckpointsStorage.Layout;

    /// @notice Initializes the storage with a list of initial checkpoints.
    /// @notice Sets the checkpoints storage version to `1`.
    /// @dev Reverts if the checkpoints storage is already initialized to version `1` or above.
    /// @dev Reverts if `checkpointIds` and `timestamps` have different lengths.
    /// @dev Emits a {CheckpointSet} event for each timestamp set with a non-zero value.
    /// @param checkpointIds the checkpoint identifiers.
    /// @param timestamps the checkpoint timestamps.
    constructor(bytes32[] memory checkpointIds, uint256[] memory timestamps) {
        CheckpointsStorage.layout().init(checkpointIds, timestamps);
    }
}
