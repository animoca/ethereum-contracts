// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {UInt256ToDecimalString} from "./../../../utils/types/UInt256ToDecimalString.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";
import {UInt256ToDecimalString} from "./../../../utils/types/UInt256ToDecimalString.sol";
import {ERC721ContractMetadataStorage} from "./ERC721ContractMetadataStorage.sol";

library ERC721TokenMetadataWithBaseURIStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;
    using UInt256ToDecimalString for uint256;

    struct Layout {
        string baseURI;
    }

    bytes32 public constant ERC721TOKENMETADATAWITHBASEURI_STORAGE_POSITION =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC721Metadata.storage")) - 1);
    bytes32 public constant ERC721TOKENMETADATAWITHBASEURI_VERSION_SLOT =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC712Metadata.version")) - 1);

    /// @dev this event needs to be declared also in contact that uses this lib
    event BaseMetadataURISet(string indexed baseMetadataURI);

    /// @notice Initialises the storage with a name, symbol and base metadata URI.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @param tokenName The name of the token.
    /// @param tokenSymbol The symbol of the token.
    /// @param baseURI The base metadata URI.
    function constructorInit(
        Layout storage s,
        string memory tokenName,
        string memory tokenSymbol,
        string memory baseURI
    ) internal {
        ERC721ContractMetadataStorage.layout().constructorInit(tokenName, tokenSymbol);
        s.baseURI = baseURI;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    /// @notice Initialises the storage with a name, symbol and base metadata URI.
    /// @notice Sets the ERC721ContractMetadataStorage storage version to `1`.
    /// @notice Sets the ERC721TokenMetadataWithBaseURIStorage storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721ContractMetadataStorage storage is already initialized to version `1` or above.
    /// @dev Reverts if the ERC721TokenMetadataWithBaseURIStorage storage is already initialized to version `1` or above.
    /// @param tokenName The name of the token.
    /// @param tokenSymbol The symbol of the token.
    /// @param baseURI The base metadata URI.
    function proxyInit(
        Layout storage s,
        string memory tokenName,
        string memory tokenSymbol,
        string memory baseURI
    ) internal {
        StorageVersion.setVersion(ERC721TOKENMETADATAWITHBASEURI_VERSION_SLOT, 1);
        ERC721ContractMetadataStorage.layout().proxyInit(tokenName, tokenSymbol);
        // Don't call s.contructorInit as ERC721ContractMetadataStorage's proxyInit method will call ERC721ContractMetadataStorage's contructorInit
        s.baseURI = baseURI;
    }

    function setBaseMetadataURI(Layout storage s, string calldata baseMetadataURI_) internal {
        s.baseURI = baseMetadataURI_;
        emit BaseMetadataURISet(baseMetadataURI_);
    }

    function baseMetadataURI(Layout storage s) internal view returns (string memory) {
        return s.baseURI;
    }

    function tokenURI(Layout storage s, uint256 tokenId) internal view returns (string memory) {
        return string(abi.encodePacked(s.baseURI, tokenId.toDecimalString()));
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721TOKENMETADATAWITHBASEURI_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
