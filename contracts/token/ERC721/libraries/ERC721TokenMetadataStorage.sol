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
    using ERC721TokenMetadataStorage for ERC721TokenMetadataStorage.Layout;

    struct Layout {
        mapping(uint256 => string) tokenURIs;
    }

    bytes32 public constant ERC721TOKENMETADATA_STORAGE_POSITION =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC721TokenMetadata.storage")) - 1);
    bytes32 public constant ERC721TOKENMETADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC712TokenMetadata.version")) - 1);

    /// @notice Initialises the storage with name and symbol.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @param tokenName The name of the token.
    /// @param tokenSymbol The symbol of the token.
    function constructorInit(
        Layout storage,
        string memory tokenName,
        string memory tokenSymbol
    ) internal {
        ERC721ContractMetadataStorage.layout().constructorInit(tokenName, tokenSymbol);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    /// @notice Initialises the storage with name and symbol.
    /// @notice Sets the ERC721ContractMetadataStorage storage version to `1`.
    /// @notice Sets the ERC721TokenMetadataStorage storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ERC721ContractMetadataStorage storage is already initialized to version `1` or above.
    /// @dev Reverts if the ERC721TokenMetadataStorage storage is already initialized to version `1` or above.
    /// @param tokenName The name of the token.
    /// @param tokenSymbol The symbol of the token.
    function proxyInit(
        Layout storage,
        string memory tokenName,
        string memory tokenSymbol
    ) internal {
        StorageVersion.setVersion(ERC721TOKENMETADATA_VERSION_SLOT, 1);
        ERC721ContractMetadataStorage.layout().proxyInit(tokenName, tokenSymbol);
        // Don't call s.contructorInit as ERC721ContractMetadataStorage's proxyInit method will call ERC721ContractMetadataStorage's contructorInit
    }

    function setTokenURI(
        Layout storage s,
        uint256 tokenId,
        string memory uri
    ) internal {
        s.tokenURIs[tokenId] = uri;
    }

    function batchSetTokenURI(
        Layout storage s,
        uint256[] calldata tokenIds,
        string[] calldata uris
    ) internal {
        require(tokenIds.length == uris.length, "ERC721: inconsistent arrays");
        unchecked {
            for (uint8 i; i < tokenIds.length; ++i) {
                s.tokenURIs[tokenIds[i]] = uris[i];
            }
        }
    }

    function tokenURI(Layout storage s, uint256 tokenId) internal view returns (string memory) {
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