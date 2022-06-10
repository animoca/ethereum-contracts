// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {CheckpointsStorage} from "./libraries/CheckpointsStorage.sol";
import {CheckpointsBase} from "./CheckpointsBase.sol";
import {ContractOwnership} from "./../access/ContractOwnership.sol";

/// @title Timestamp-based checkpoints management (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract Checkpoints is CheckpointsBase, ContractOwnership {
    using CheckpointsStorage for CheckpointsStorage.Layout;

    /// @notice Initializes the storage with a list of initial checkpoints.
    /// @dev Reverts if `checkpointIds` and `timestamps` have different lengths.
    /// @dev Emits a {CheckpointSet} event for each timestamp set with a non-zero value.
    /// @param checkpointIds The checkpoint identifiers.
    /// @param timestamps The checkpoint timestamps.
    constructor(bytes32[] memory checkpointIds, uint256[] memory timestamps) {
        CheckpointsStorage.layout().constructorInit(checkpointIds, timestamps);
    }
}
