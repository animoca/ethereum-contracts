// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

library PauseStorage {
    using PauseStorage for PauseStorage.Layout;

    struct Layout {
        bool isPaused;
    }

    bytes32 public constant PAUSE_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.lifecycle.Pause.storage")) - 1);
    bytes32 public constant PAUSE_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.lifecycle.Pause.version")) - 1);

    event Paused();
    event Unpaused();

    /// @notice Initializes the storage with an initial paused state.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @dev Emits a {Paused} event if `isPaused` is true.
    /// @param isPaused the initial pause state.
    function constructorInit(Layout storage s, bool isPaused) internal {
        if (isPaused) {
            s.isPaused = true;
            emit Paused();
        }
    }

    /// @notice Initializes the storage with an initial paused state.
    /// @notice Sets the pause storage version to `1`.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the pause storage is already initialized to version `1` or above.
    /// @dev Emits a {Paused} event if `isPaused` is true.
    /// @param isPaused the initial pause state.
    function proxyInit(Layout storage s, bool isPaused) internal {
        StorageVersion.setVersion(PAUSE_VERSION_SLOT, 1);
        s.constructorInit(isPaused);
    }

    /// @notice Pauses the contract.
    /// @dev Reverts if the contract is paused.
    /// @dev Emits a {Paused} event.
    function pause(Layout storage s) internal {
        s.enforceIsNotPaused();
        s.isPaused = true;
        emit Paused();
    }

    /// @notice Unpauses the contract.
    /// @dev Reverts if the contract is not paused.
    /// @dev Emits an {Unpaused} event.
    function unpause(Layout storage s) internal {
        s.enforceIsPaused();
        s.isPaused = false;
        emit Unpaused();
    }

    /// @notice Gets the paused state of the contract.
    /// @return isPaused The paused state of the contract.
    function paused(Layout storage s) internal view returns (bool isPaused) {
        return s.isPaused;
    }

    /// @notice Ensures that the contract is paused.
    /// @dev Reverts if the contract is not paused.
    function enforceIsPaused(Layout storage s) internal view {
        require(s.isPaused, "Pause: not paused");
    }

    /// @notice Ensures that the contract is not paused.
    /// @dev Reverts if the contract is paused.
    function enforceIsNotPaused(Layout storage s) internal view {
        require(!s.isPaused, "Pause: paused");
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = PAUSE_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
