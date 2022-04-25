// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;


import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC721ContractMetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        string name;
        string symbol;
    }

    bytes32 public constant ERC721CONTRACTMETADATA_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.token.ERC721.ERC721ContractMetadata.storage")) - 1);
    bytes32 public constant ERC721CONTRACTMETADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC712ContractMetadata.version")) - 1);

    /// @notice Initialises the storage with a name and symbol.
    /// @notice Sets the ERC721ContractMetadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Metadata.
    /// @dev Reverts if the ERC721ContractMetadata storage is already initialized to version `1` or above.
    /// @param name_ The Non-Fungible token name.
    /// @param symbol_ The Non-Fungible token symbol.
    function init(Layout storage s, string memory name_, string memory symbol_) internal {
        StorageVersion.setVersion(ERC721CONTRACTMETADATA_VERSION_SLOT, 1);
        s.name = name_;
        s.symbol = symbol_;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721CONTRACTMETADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}