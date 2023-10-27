// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ICheckpoints} from "./../interfaces/ICheckpoints.sol";
import {CheckpointsStorage} from "./../libraries/CheckpointsStorage.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Timestamp-based checkpoints management (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC173 (Contract Ownership standard).
abstract contract CheckpointsBase is ICheckpoints, Context {
    using CheckpointsStorage for CheckpointsStorage.Layout;
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    /// @notice Sets the checkpoints.
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {CheckpointAlreadySet} if the checkpoint is already set.
    /// @dev Emits a {CheckpointSet} event if the timestamp is set to a non-zero value.
    /// @param checkpointId The checkpoint identifiers.
    /// @param timestamp The checkpoint timestamps.
    function setCheckpoint(bytes32 checkpointId, uint256 timestamp) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        CheckpointsStorage.layout().setCheckpoint(checkpointId, timestamp);
    }

    /// @notice Sets a batch of checkpoints.
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {CheckpointAlreadySet} if one of the checkpoints is already set.
    /// @dev Emits a {CheckpointSet} event for each timestamp set to a non-zero value.
    /// @param checkpointIds The checkpoint identifier.
    /// @param timestamps The checkpoint timestamp.
    function batchSetCheckpoint(bytes32[] calldata checkpointIds, uint256[] calldata timestamps) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        CheckpointsStorage.layout().batchSetCheckpoint(checkpointIds, timestamps);
    }

    /// @notice Sets the checkpoint to the current block timestamp.
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {CheckpointReached} if the checkpoint is set and the current block timestamp has already reached it.
    /// @dev Emits a {CheckpointSet} event.
    /// @param checkpointId The checkpoint identifier.
    function triggerCheckpoint(bytes32 checkpointId) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        CheckpointsStorage.layout().triggerCheckpoint(checkpointId);
    }

    /// @inheritdoc ICheckpoints
    function checkpoint(bytes32 checkpointId) external view returns (uint256) {
        return CheckpointsStorage.layout().checkpoint(checkpointId);
    }

    /// @inheritdoc ICheckpoints
    function checkpointReached(bytes32 checkpointId) external view returns (bool) {
        return CheckpointsStorage.layout().checkpointReached(checkpointId);
    }
}
