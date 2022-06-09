// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721TokenMetadataStorage} from "./libraries/ERC721TokenMetadataStorage.sol";
import {ERC721TokenMetadataBase} from "./ERC721TokenMetadataBase.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (immutable version)
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation
abstract contract ERC721TokenMetadata is ERC721TokenMetadataBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721TokenMetadataStorage for ERC721TokenMetadataStorage.Layout;

    /// @notice Initializes the storage.
    /// @notice Sets the ERC721ContractMetadata storage version to `1`.
    /// @notice Sets the ERC721TokenMetadata storage version to `1`.
    /// @notice Marks the following ERC165 interfaces as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721ContractMetadata storage is already initialized to version `1` or above.
    /// @dev Reverts if the ERC721TokenMetadata storage is already initialized to version `1` or above.
    /// @param tokenName The token name.
    /// @param tokenSymbol The token symbol.
    constructor(string memory tokenName, string memory tokenSymbol) {
        ERC721TokenMetadataStorage.constructorInit(tokenName, tokenSymbol);
    }
}
