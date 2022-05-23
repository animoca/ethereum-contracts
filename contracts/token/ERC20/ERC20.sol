// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC20Storage} from "./libraries/ERC20Storage.sol";
import {ERC20Base} from "./ERC20Base.sol";

/// @title ERC20 Fungible Token Standard (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
contract ERC20 is ERC20Base {
    using ERC20Storage for ERC20Storage.Layout;

    /// @notice Initialises the storage with a list of initial allocations.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20, ERC20Allowance.
    /// @dev Reverts if `holders` and `allocations` have different lengths.
    /// @dev Reverts if one of `holders` is the zero address.
    /// @dev Reverts if the total supply overflows.
    /// @dev Emits a {Transfer} event for each transfer with `from` set to the zero address.
    /// @param holders The list of accounts to mint the tokens to.
    /// @param allocations The list of amounts of tokens to mint to each of `holders`.
    constructor(address[] memory holders, uint256[] memory allocations) {
        ERC20Storage.layout().constructorInit(holders, allocations);
    }
}
