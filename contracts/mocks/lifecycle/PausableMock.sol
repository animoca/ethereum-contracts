// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPause} from "./../../lifecycle/libraries/LibPause.sol";
import {Pausable} from "./../../lifecycle/Pausable.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract PausableMock is Pausable {
    constructor(bool paused_) Pausable(paused_) Ownable(msg.sender) {}

    function enforceIsPaused() external view {
        LibPause.enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        LibPause.enforceIsNotPaused();
    }
}
