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

    /// @notice Initialises the storage
    /// @notice Sets the ERC721 storage version to `1`
    /// @notice Marks the following ERC165 interfaces as supported: IERCMetadata
    /// @dev Reverts if the ERC721 ContractMetadataStorage or the ERC721TokenMetadataWithBaseURIStorage
    /// is already initialized to version `1` or above.
    /// @param name_ The Non-Fungible token name.
    /// @param symbol_ The Non-Fungible token symbol.
    constructor(string memory name_, string memory symbol_) {
        ERC721TokenMetadataStorage.layout().init(name_, symbol_);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }
}
