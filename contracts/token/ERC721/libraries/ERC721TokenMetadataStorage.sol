// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";
import {UInt256ToDecimalString} from "./../../../utils/types/UInt256ToDecimalString.sol";
import {ERC721ContractMetadataStorage} from "./ERC721ContractMetadataStorage.sol";

library ERC721TokenMetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;

    struct Layout {
        mapping(uint256 => string) tokenURIs;
    }

    bytes32 public constant ERC721TOKENMETADATA_STORAGE_POSITION =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC721TokenMetadata.storage")) - 1);
    bytes32 public constant ERC721TOKENMETADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC712TokenMetadata.version")) - 1);

    /// @notice Initialises the storage with name and symbol
    /// @notice Sets the ERC721TokenMetadataStorage storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721TokenMetadataStorage storage is already initialized to version `1` or above.
    /// @param name_ The Non-Fungible token name.
    /// @param symbol_ The Non-Fungible token symbol.
    function init(
        Layout storage,
        string memory name_,
        string memory symbol_
    ) internal {
        StorageVersion.setVersion(ERC721TOKENMETADATA_VERSION_SLOT, 1);
        ERC721ContractMetadataStorage.layout().init(name_, symbol_);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    function setTokenURI(
        Layout storage s,
        uint256 tokenId,
        string memory tokenURI
    ) internal {
        s.tokenURIs[tokenId] = tokenURI;
    }

    function batchSetTokenURI(
        Layout storage s,
        uint256[] calldata tokenIds,
        string[] calldata tokenURIs
    ) internal {
        require(tokenIds.length == tokenURIs.length, "ERC721: Input counts not equal");
        unchecked {
            for (uint8 i; i < tokenIds.length; ++i) {
                s.tokenURIs[tokenIds[i]] = tokenURIs[i];
            }
        }
    }

    function contractTokenURI(Layout storage s, uint256 tokenId) internal view returns (string memory) {
        require(bytes(s.tokenURIs[tokenId]).length != 0, "ERC721: non-existing NFT");
        return s.tokenURIs[tokenId];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721TOKENMETADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
