// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721Base} from "./ERC721Base.sol";

/// @title ERC721 Non-Fungible Token Standard (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.

contract ERC721 is ERC721Base {
    using ERC721Storage for ERC721Storage.Layout;

    /// @notice Initialises the storage
    /// @notice Sets the ERC721 storage version to `1`
    /// @notice Marks the following ERC165 interfaces as supported: IERC721
    /// @dev Reverts if the ERC20 storage is already initialized to version `1` or above.
    constructor() {
        ERC721Storage.layout().init();
    }
}
