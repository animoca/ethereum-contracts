// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ContractOwnershipStorage} from "./libraries/ContractOwnershipStorage.sol";
import {InterfaceDetection} from "./../introspection/InterfaceDetection.sol";
import {ContractOwnershipBase} from "./ContractOwnershipBase.sol";

/// @title ERC173 Contract Ownership Standard (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ContractOwnership is ContractOwnershipBase, InterfaceDetection {
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    /// @notice Initializes the storage with an initial contract owner.
    /// @notice Marks the following ERC165 interfaces as supported: ERC173.
    /// @dev Emits as {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner the initial contract owner.
    constructor(address initialOwner) {
        ContractOwnershipStorage.layout().constructorInit(initialOwner);
    }
}
