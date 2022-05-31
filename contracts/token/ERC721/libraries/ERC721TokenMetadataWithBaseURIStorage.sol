// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";
import {UInt256ToDecimalString} from "./../../../utils/types/UInt256ToDecimalString.sol";
import {ERC721ContractMetadataStorage} from "./ERC721ContractMetadataStorage.sol";

library ERC721TokenMetadataWithBaseURIStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;

    struct Layout {
        string tokenURI;
    }

    bytes32 public constant ERC721TOKENMETADATAWITHBASEURI_STORAGE_POSITION =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC721Metadata.storage")) - 1);
    bytes32 public constant ERC721TOKENMETADATAWITHBASEURI_VERSION_SLOT =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC712Metadata.version")) - 1);

    /// @notice Initialises the storage with a tokenURI.
    /// @notice Sets the ERC721TokenMetadataWithBaseURIStorage storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721TokenMetadataWithBaseURIStorage storage is already initialized to version `1` or above.
    /// @param name_ The Non-Fungible token name.
    /// @param symbol_ The Non-Fungible token symbol.
    /// @param tokenURI_ the Non-Fungle token tokenURI.
    function init(
        Layout storage s,
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) internal {
        StorageVersion.setVersion(ERC721TOKENMETADATAWITHBASEURI_VERSION_SLOT, 1);
        ERC721ContractMetadataStorage.layout().init(name_, symbol_);
        s.tokenURI = tokenURI_;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    function contractTokenURI(Layout storage s) internal view returns (string memory) {
        return s.tokenURI;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721TOKENMETADATAWITHBASEURI_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
