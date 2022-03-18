// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibOwnership} from "./libraries/LibOwnership.sol";
import {OwnableBase} from "./OwnableBase.sol";

/**
 * @title ERC173 Contract Ownership Standard (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 */
contract OwnableFacet is OwnableBase {
    /**
     * Initializes the storage, setting the initial owner.
     * @dev Emits an {IERC173-OwnershipTransferred(address,address)} event.
     * @param owner_ the initial contract owner.
     */
    function initOwnershipStorage(address owner_) external {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibOwnership.initOwnershipStorage(owner_);
    }
}
