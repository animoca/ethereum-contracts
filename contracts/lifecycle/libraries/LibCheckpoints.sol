// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Bytes32} from "./../../utils/libraries/Bytes32.sol";
import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

library LibCheckpoints {
    using Bytes32 for bytes32;

    /// Emitted when a checkpoint is set.
    event CheckpointSet(bytes32 checkpointId, uint256 timestamp);

    bytes32 public constant CHECKPOINTS_STORAGE_POSITION = keccak256("animoca.core.lifecycle.checkpoints.storage");
    bytes32 public constant CHECKPOINTS_VERSION_SLOT = keccak256("animoca.core.lifecycle.checkpoints.version");

    struct CheckpointsStorage {
        // checkpointId => timestamp
        mapping(bytes32 => uint256) checkpoints;
    }

    function checkpointsStorage() internal pure returns (CheckpointsStorage storage s) {
        bytes32 position = CHECKPOINTS_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * Initialises the storage with a list of initial checkpoints.
     * @dev reverts if the contract is already initialised.
     * @dev reverts if `checkpointIds` and `timestamps` have different lengths.
     * @dev emits a {CheckpointSet} event for each timestamp set (non-zero value).
     * @param checkpointIds the checkpoint identifiers.
     * @param timestamps the checkpoint timestamps.
     */
    function initCheckpointsStorage(bytes32[] memory checkpointIds, uint256[] memory timestamps) internal {
        StorageVersion.setVersion(CHECKPOINTS_VERSION_SLOT, 1);
        require(checkpointIds.length == timestamps.length, "Checkpoints: wrong array length");
        CheckpointsStorage storage s = checkpointsStorage();
        for (uint256 i; i < checkpointIds.length; ++i) {
            uint256 timestamp = timestamps[i];
            if (timestamp != 0) {
                bytes32 checkpointId = checkpointIds[i];
                s.checkpoints[checkpointId] = timestamp;
                emit CheckpointSet(checkpointId, timestamp);
            }
        }
    }

    /**
     * Gets the checkpoint timestamp.
     * @param checkpointId the checkpoint identifier.
     * @return the timestamp associated to the checkpoint. A zero value indicates that the checkpoint is not set.
     */
    function checkpoint(bytes32 checkpointId) internal view returns (uint256) {
        return checkpointsStorage().checkpoints[checkpointId];
    }

    /**
     * Retrieves whether the checkpoint has been reached already.
     * @param checkpointId the checkpoint identifier.
     * @return true if the checkpoint has been set and the current block timestamp has already reached it, false otherwise.
     */
    function checkpointReached(bytes32 checkpointId) internal view returns (bool) {
        return _checkpointReached(checkpointsStorage(), checkpointId);
    }

    /**
     * Ensures that the checkpoint has been reached already.
     * @param checkpointId the checkpoint identifier.
     * @dev reverts if the checkpoint is not set or if the current block timestamp has not reached it yet.
     */
    function enforceCheckpointReached(bytes32 checkpointId) internal view {
        if (!_checkpointReached(checkpointsStorage(), checkpointId)) {
            revert(string(abi.encodePacked("Checkpoints: checkpoint '", checkpointId.toASCIIString(), "' not reached yet")));
        }
    }

    /**
     * Ensures that the checkpoint has not been reached yet.
     * @param checkpointId the checkpoint identifier.
     * @dev reverts if checkpoint is set and the current block timestamp has already reached it.
     */
    function enforceCheckpointNotReached(bytes32 checkpointId) internal view {
        _enforceCheckpointNotReached(checkpointsStorage(), checkpointId);
    }

    /**
     * Sets the checkpoint to the current block timestamp.
     * @dev reverts if the checkpoint is set and the current block timestamp has already reached it.
     * @dev emits a {CheckpointSet} event.
     * @param checkpointId the checkpoint identifier.
     */
    function triggerCheckpoint(bytes32 checkpointId) internal {
        CheckpointsStorage storage s = checkpointsStorage();
        _enforceCheckpointNotReached(s, checkpointId);
        s.checkpoints[checkpointId] = block.timestamp;
        emit CheckpointSet(checkpointId, block.timestamp);
    }

    /**
     * Sets the checkpoint.
     * @dev reverts if the checkpoint is already set.
     * @dev emits a {CheckpointSet} event if the timestamp is set (non-zero value).
     * @param checkpointId the checkpoint identifier.
     * @param timestamp the checkpoint's timestamp.
     */
    function setCheckpoint(bytes32 checkpointId, uint256 timestamp) internal {
        CheckpointsStorage storage s = checkpointsStorage();
        if (s.checkpoints[checkpointId] != 0) {
            revert(string(abi.encodePacked("Checkpoints: checkpoint '", checkpointId.toASCIIString(), "' already set")));
        }
        if (timestamp != 0) {
            s.checkpoints[checkpointId] = timestamp;
            emit CheckpointSet(checkpointId, timestamp);
        }
    }

    function _checkpointReached(CheckpointsStorage storage s, bytes32 checkpointId) private view returns (bool) {
        uint256 checkpoint_ = s.checkpoints[checkpointId];
        return checkpoint_ != 0 && block.timestamp >= checkpoint_;
    }

    function _enforceCheckpointNotReached(CheckpointsStorage storage s, bytes32 checkpointId) private view {
        if (_checkpointReached(s, checkpointId)) {
            revert(string(abi.encodePacked("Checkpoints: checkpoint '", checkpointId.toASCIIString(), "' already reached")));
        }
    }
}
