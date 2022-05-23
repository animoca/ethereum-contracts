// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {PauseStorage} from "./libraries/PauseStorage.sol";
import {PauseBase} from "./PauseBase.sol";
import {ContractOwnership} from "../access/ContractOwnership.sol";

/// @title Pausing mechanism (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract Pause is PauseBase, ContractOwnership {
    using PauseStorage for PauseStorage.Layout;

    /// @notice Initializes the storage with an initial paused state.
    /// @notice Sets the pause storage version to `1`.
    /// @dev Reverts if the pause storage is already initialized to version `1` or above.
    /// @dev Emits a {Paused} event if `isPaused` is true.
    /// @param isPaused the initial pause state.
    constructor(bool isPaused) {
        PauseStorage.layout().init(isPaused);
    }
}
