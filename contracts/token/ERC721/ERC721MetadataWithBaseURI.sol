// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
import {TokenMetadataWithBaseURIStorage} from "./../metadata/libraries/TokenMetadataWithBaseURIStorage.sol";
import {ERC721MetadataWithBaseURIBase} from "./ERC721MetadataWithBaseURIBase.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (immutable version).
/// @notice ERC721Metadata implementation where tokenURIs are the concatenation of a base metadata URI and the token identifier (decimal).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721MetadataWithBaseURI is ERC721MetadataWithBaseURIBase, ContractOwnership {
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    using TokenMetadataWithBaseURIStorage for TokenMetadataWithBaseURIStorage.Layout;

    /// @notice Initializes the storage with a name, symbol and base metadata URI.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Emits a {BaseMetadataURISet} event.
    /// @param tokenName The token name.
    /// @param tokenSymbol The token symbol.
    /// @param baseURI The base metadata URI.
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        string memory baseURI
    ) {
        ERC721ContractMetadataStorage.layout().constructorInit(tokenName, tokenSymbol);
        TokenMetadataWithBaseURIStorage.layout().constructorInit(baseURI);
    }
}
