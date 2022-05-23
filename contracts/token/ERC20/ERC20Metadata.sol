// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC20MetadataStorage} from "./libraries/ERC20MetadataStorage.sol";
import {ERC20MetadataBase} from "./ERC20MetadataBase.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Metadata (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20Metadata is ERC20MetadataBase, ContractOwnership {
    using ERC20MetadataStorage for ERC20MetadataStorage.Layout;

    /// @notice Initialises the storage with an initial token URI.
    /// @notice Sets the ERC20Metadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Reverts if the ERC20Metadata storage is already initialized to version `1` or above.
    /// @param uri The token URI.
    constructor(string memory uri) {
        ERC20MetadataStorage.layout().init(uri);
    }
}
