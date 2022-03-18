// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibPause} from "./libraries/LibPause.sol";
import {PausableBase} from "./PausableBase.sol";

/**
 * @title Pausing mechanism (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 * @dev Note: This facet depends on {OwnableFacet}.
 */
contract PausableFacet is PausableBase {
    /**
     * Initialises the storage with an initial paused state.
     * @dev Caution: this function should not be exposed through the diamond interface. It is meant to be called only via `diamondCut`.
     * @dev reverts if the contract is already initialised.
     * @dev emits a {Paused} event if `paused` is true.
     * @param paused_ the initial pause state.
     */
    function initPauseStorage(bool paused_) external {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibPause.initPauseStorage(paused_);
    }
}
