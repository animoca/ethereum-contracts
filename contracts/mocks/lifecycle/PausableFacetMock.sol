// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPause} from "./../../lifecycle/libraries/LibPause.sol";
import {PausableFacet} from "./../../lifecycle/PausableFacet.sol";

contract PausableFacetMock is PausableFacet {
    function enforceIsPaused() external view {
        LibPause.enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        LibPause.enforceIsNotPaused();
    }
}
