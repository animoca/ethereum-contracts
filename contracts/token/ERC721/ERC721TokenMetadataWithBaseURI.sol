// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
import {ERC721TokenMetadataWithBaseURIBase} from "./ERC721TokenMetadataWithBaseURIBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (immutable version)
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation
abstract contract ERC721TokenMetadataWithBaseURI is ERC721TokenMetadataWithBaseURIBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;

    /// @notice Initialises the storage
    /// @notice Sets the ERC721 storage version to `1`
    /// @notice Marks the following ERC165 interfaces as supported: IERCMetadata
    /// @dev Reverts if the ERC721 ContractMetadataStorage or the ERC721TokenMetadataWithBaseURIStorage
    /// is already initialized to version `1` or above.
    /// @param name_ The Non-Fungible token name.
    /// @param symbol_ The Non-Fungible token symbol.
    /// @param tokenURI_ the Non-Fungle token tokenURI.
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) {
        ERC721TokenMetadataWithBaseURIStorage.layout().init(name_, symbol_, tokenURI_);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }
}
