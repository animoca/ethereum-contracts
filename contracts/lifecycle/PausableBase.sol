// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPause} from "./libraries/LibPause.sol";
import {LibOwnership} from "./../access/libraries/LibOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Pausing mechanism (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibPause.initPauseStorage(paused_)` should be called during contract initialisation.
 * @dev Note: This contract requires ERC173 (Contract Ownership standard).
 */
abstract contract PausableBase is Context {
    /**
     * Gets the paused state of the contract.
     * @return the paused state of the contract.
     */
    function paused() external view returns (bool) {
        return LibPause.paused();
    }

    /**
     * Pauses the contract.
     * @dev reverts if the sender is not the contract owner.
     * @dev reverts if the contract is paused.
     * @dev emits a {Paused} event.
     */
    function pause() external {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibPause.pause();
    }

    /**
     * Unpauses the contract.
     * @dev reverts if the sender is not the contract owner.
     * @dev reverts if the contract is not paused.
     * @dev emits an {Unpaused} event.
     */
    function unpause() external {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibPause.unpause();
    }
}
