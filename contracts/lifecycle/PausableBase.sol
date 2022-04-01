// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {PauseStorage} from "./libraries/PauseStorage.sol";
import {OwnershipStorage} from "./../access/libraries/OwnershipStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Pausing mechanism (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `PauseStorage.init` should be called during contract initialization.
/// @dev Note: This contract requires ERC173 (Contract Ownership standard).
abstract contract PausableBase is Context {
    using PauseStorage for PauseStorage.Layout;
    using OwnershipStorage for OwnershipStorage.Layout;

    /// @notice Emitted when the pause is triggered.
    event Paused();

    /// @notice Emitted when the pause is lifted.
    event Unpaused();

    /// @notice Pauses the contract.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Reverts if the contract is paused.
    /// @dev Emits a {Paused} event.
    function pause() external {
        OwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        PauseStorage.layout().pause();
    }

    /// @notice Unpauses the contract.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Reverts if the contract is not paused.
    /// @dev Emits an {Unpaused} event.
    function unpause() external {
        OwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        PauseStorage.layout().unpause();
    }

    /// @notice Gets the paused state of the contract.
    /// @return isPaused The paused state of the contract.
    function paused() external view returns (bool) {
        return PauseStorage.layout().paused();
    }
}
