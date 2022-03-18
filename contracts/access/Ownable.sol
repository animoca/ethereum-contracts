// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./libraries/LibOwnership.sol";
import {ERC165} from "./../introspection/ERC165.sol";
import {OwnableBase} from "./OwnableBase.sol";

/**
 * @title ERC173 Contract Ownership Standard (immutable version).
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract Ownable is OwnableBase, ERC165 {
    /**
     * Initializes the contract, setting the initial owner.
     * @dev Emits an {IERC173-OwnershipTransferred(address,address)} event.
     * @param owner_ the initial contract owner.
     */
    constructor(address owner_) {
        LibOwnership.initOwnershipStorage(owner_);
    }
}
