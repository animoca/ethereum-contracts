// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {PauseStorage} from "./../../lifecycle/libraries/PauseStorage.sol";
import {PausableFacet} from "./../../lifecycle/PausableFacet.sol";

contract PausableFacetMock is PausableFacet {
    using PauseStorage for PauseStorage.Layout;

    function enforceIsPaused() external view {
        PauseStorage.layout().enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        PauseStorage.layout().enforceIsNotPaused();
    }
}
