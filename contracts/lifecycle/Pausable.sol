// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPause} from "./libraries/LibPause.sol";
import {PausableBase} from "./PausableBase.sol";
import {Ownable} from "../access/Ownable.sol";

/**
 * @title Pausing mechanism (immutable version).
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract Pausable is PausableBase, Ownable {
    /**
     * Initialises the storage with an initial paused state.
     * @dev emits a {Paused} event if `paused` is true.
     * @param paused_ the initial pause state.
     */
    constructor(bool paused_) {
        LibPause.initPauseStorage(paused_);
    }
}
