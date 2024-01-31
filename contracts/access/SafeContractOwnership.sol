// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {SafeContractOwnershipStorage} from "./libraries/SafeContractOwnershipStorage.sol";
import {SafeContractOwnershipBase} from "./base/SafeContractOwnershipBase.sol";
import {InterfaceDetection} from "./../introspection/InterfaceDetection.sol";

/// @title ERC173 Contract Ownership Standard (immutable version).
/// @dev See https://eips.ethereum.org/EIPS/eip-173
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract SafeContractOwnership is SafeContractOwnershipBase, InterfaceDetection {
    using SafeContractOwnershipStorage for SafeContractOwnershipStorage.Layout;

    /// @notice Initializes the storage with an initial contract owner.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC173.
    /// @dev Emits an {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner the initial contract owner.
    constructor(address initialOwner) {
        SafeContractOwnershipStorage.layout().constructorInit(initialOwner);
    }
}
