// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
import {ERC721MetadataPerTokenBase} from "./base/ERC721MetadataPerTokenBase.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (immutable version).
/// @notice ERC721Metadata implementation where tokenURIs are set individually per token.
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721MetadataPerToken is ERC721MetadataPerTokenBase, ContractOwnership {
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;

    /// @notice Initializes the storage with a name and symbol.
    /// @notice Marks the following ERC165 interfaces as supported: ERC721Metadata.
    /// @param tokenName The token name.
    /// @param tokenSymbol The token symbol.
    constructor(string memory tokenName, string memory tokenSymbol) {
        ERC721ContractMetadataStorage.layout().constructorInit(tokenName, tokenSymbol);
    }
}
