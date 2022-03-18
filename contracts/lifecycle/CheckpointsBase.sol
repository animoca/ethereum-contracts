// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./../access/libraries/LibOwnership.sol";
import {LibCheckpoints} from "./libraries/LibCheckpoints.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Timestamp-based checkpoints management (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibCheckpoints.initCheckpointsStorage(checkpointIds, timestamps)` should be called during contract initialisation.
 * @dev Note: This contract requires ERC173 (Contract Ownership standard).
 */
abstract contract CheckpointsBase is Context {
    /**
     * Gets the checkpoint timestamp.
     * @param checkpointId the checkpoint identifier.
     * @return the checkpoint timestamp. A zero-value of zero indicates the checkpoint is not set.
     */
    function checkpoint(bytes32 checkpointId) external view returns (uint256) {
        return LibCheckpoints.checkpoint(checkpointId);
    }

    /**
     * Retrieves whether the checkpoint has been reached already.
     * @param checkpointId the checkpoint identifier.
     * @return true if the checkpoint has been set and the current block timestamp has already reached it, false otherwise.
     */
    function checkpointReached(bytes32 checkpointId) external view returns (bool) {
        return LibCheckpoints.checkpointReached(checkpointId);
    }

    /**
     * Sets the checkpoint to the current block timestamp.
     * @dev reverts if the caller is not the contract owner.
     * @dev reverts if the checkpoint is set and the current block timestamp has already reached it.
     * @dev emits a {CheckpointSet} event.
     * @param checkpointId the checkpoint identifier.
     */
    function triggerCheckpoint(bytes32 checkpointId) external {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibCheckpoints.triggerCheckpoint(checkpointId);
    }

    /**
     * Sets the checkpoint.
     * @dev reverts if the checkpoint is already set.
     * @dev emits a {CheckpointSet} event.
     * @param checkpointId the checkpoint identifier.
     * @param timestamp the checkpoint's timestamp.
     */
    function setCheckpoint(bytes32 checkpointId, uint256 timestamp) external {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibCheckpoints.setCheckpoint(checkpointId, timestamp);
    }
}
