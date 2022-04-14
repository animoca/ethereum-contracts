// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {PauseStorage} from "./../../lifecycle/libraries/PauseStorage.sol";
import {PausableFacet} from "./../../lifecycle/PausableFacet.sol";

contract PausableFacetMock is PausableFacet {
    using PauseStorage for PauseStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) PausableFacet(forwarderRegistry) {}

    function enforceIsPaused() external view {
        PauseStorage.layout().enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        PauseStorage.layout().enforceIsNotPaused();
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
