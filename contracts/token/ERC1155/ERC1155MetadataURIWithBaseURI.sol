// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC1155Storage} from "./libraries/ERC1155Storage.sol";
import {TokenMetadataWithBaseURIStorage} from "./../metadata/libraries/TokenMetadataWithBaseURIStorage.sol";
import {ERC1155MetadataURIWithBaseURIBase} from "./base/ERC1155MetadataURIWithBaseURIBase.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC1155 Multi Token Standard, optional extension: MetadataURIPerToken (immutable version).
/// @notice ERC1155MetadataURI implementation where tokenURIs are the concatenation of a base metadata URI and the token identifier (decimal).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC1155MetadataURIWithBaseURI is ERC1155MetadataURIWithBaseURIBase, ContractOwnership {
    using TokenMetadataWithBaseURIStorage for TokenMetadataWithBaseURIStorage.Layout;

    /// @notice Initializes the storage with a base metadata URI.
    /// @notice Marks the fllowing ERC165 interface(s) as supported: ERC1155MetadataURI
    /// @dev Emits a {BaseMetadataURISet} event.
    /// @param baseURI The base metadata URI.
    constructor(string memory baseURI) {
        ERC1155Storage.initERC1155MetadataURI();
        TokenMetadataWithBaseURIStorage.layout().constructorInit(baseURI);
    }
}
