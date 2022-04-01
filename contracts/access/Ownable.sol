// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {OwnershipStorage} from "./libraries/OwnershipStorage.sol";
import {ERC165} from "./../introspection/ERC165.sol";
import {OwnableBase} from "./OwnableBase.sol";

/// @title ERC173 Contract Ownership Standard (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract Ownable is OwnableBase, ERC165 {
    using OwnershipStorage for OwnershipStorage.Layout;

    /// @notice Initialises the storage with an initial contract owner.
    /// @notice Sets the ownership storage version to 1.
    /// @notice Marks the following ERC165 interfaces as supported: ERC173.
    /// @dev Reverts if the ownership storage is already initialized to version `1` or above.
    /// @dev Emits as {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner the initial contract owner.
    constructor(address initialOwner) {
        OwnershipStorage.layout().init(initialOwner);
    }
}
