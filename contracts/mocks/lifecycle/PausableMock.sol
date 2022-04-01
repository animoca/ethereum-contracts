// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {PauseStorage} from "./../../lifecycle/libraries/PauseStorage.sol";
import {Pausable} from "./../../lifecycle/Pausable.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract PausableMock is Pausable {
    using PauseStorage for PauseStorage.Layout;

    constructor(bool paused_) Pausable(paused_) Ownable(msg.sender) {}

    function enforceIsPaused() external view {
        PauseStorage.layout().enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        PauseStorage.layout().enforceIsNotPaused();
    }
}
