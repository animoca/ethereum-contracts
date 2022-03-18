// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

library LibPause {
    ///Emitted when the pause is triggered.
    event Paused();

    ///Emitted when the pause is lifted.
    event Unpaused();

    bytes32 public constant PAUSE_STORAGE_POSITION = keccak256("animoca.core.lifecycle.pause.storage");
    bytes32 public constant PAUSE_VERSION_SLOT = keccak256("animoca.core.lifecycle.pause.version");

    struct PauseStorage {
        bool paused;
    }

    function pauseStorage() internal pure returns (PauseStorage storage s) {
        bytes32 position = PAUSE_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * Initialises the storage with an initial paused state.
     * @dev reverts if the contract is already initialised.
     * @dev emits a {Paused} event if `paused` is true.
     * @param paused_ the initial pause state.
     */
    function initPauseStorage(bool paused_) internal {
        StorageVersion.setVersion(PAUSE_VERSION_SLOT, 1);
        if (paused_) {
            pauseStorage().paused = true;
            emit Paused();
        }
    }

    /**
     * Gets the paused state of the contract.
     * @return the paused state of the contract.
     */
    function paused() internal view returns (bool) {
        return pauseStorage().paused;
    }

    /**
     * Ensures that the contract is not paused.
     * @dev reverts if the contract is paused.
     */
    function enforceIsNotPaused() internal view {
        _enforceIsNotPaused(pauseStorage());
    }

    /**
     * Ensures that the contract is paused.
     * @dev reverts if the contract is not paused.
     */
    function enforceIsPaused() internal view {
        _enforceIsPaused(pauseStorage());
    }

    /**
     * Pauses the contract.
     * @dev reverts if the contract is paused.
     * @dev emits a {Paused} event.
     */
    function pause() internal {
        PauseStorage storage s = pauseStorage();
        _enforceIsNotPaused(s);
        s.paused = true;
        emit Paused();
    }

    /**
     * Unpauses the contract.
     * @dev reverts if the contract is not paused.
     * @dev emits an {Unpaused} event.
     */
    function unpause() internal {
        PauseStorage storage s = pauseStorage();
        _enforceIsPaused(s);
        s.paused = false;
        emit Unpaused();
    }

    function _enforceIsNotPaused(PauseStorage storage s) private view {
        require(!s.paused, "Pause: paused");
    }

    function _enforceIsPaused(PauseStorage storage s) private view {
        require(s.paused, "Pause: not paused");
    }
}
