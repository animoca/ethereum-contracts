// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC721MetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        string name;
        string symbol;
        string tokenURI;
    }

    bytes32 public constant ERC721METADATA_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.token.ERC721.ERC721Metadata.storage")) - 1);
    bytes32 public constant ERC721METADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC712Metadata.version")) - 1);

    /// @notice Initialises the storage with an initial token URI.
    /// @notice Sets the ERC721Metadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721Metadata storage is already initialized to version `1` or above.
    /// @param tokenUri_ The token URI.
    /// @param name_ The NFT name.
    /// @param symbol_ The NFT symbol.
    function init(Layout storage s, string memory name_, string memory symbol_, string memory tokenUri_) internal {
        StorageVersion.setVersion(ERC721METADATA_VERSION_SLOT, 1);
        s.name = name_;
        s.symbol = symbol_;
        s.tokenURI = tokenUri_;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721METADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}