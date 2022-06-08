// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./../interfaces/IERC721Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC721ContractMetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;

    struct Layout {
        string tokenName;
        string tokenSymbol;
    }

    bytes32 public constant ERC721CONTRACTMETADATA_STORAGE_POSITION =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC721ContractMetadata.storage")) - 1);
    bytes32 public constant ERC721CONTRACTMETADATA_VERSION_SLOT =
        bytes32(uint256(keccak256("animoca.token.ERC721.ERC712ContractMetadata.version")) - 1);

    /// @notice Initialises the storage with a name and symbol.
    /// @dev Note: This function should be called by the init function of an ERC721 token metadata strategy library.
    /// @dev Note: If called by a `proxyInit` function, should perform `StorageVersion.setVersion(ERC721CONTRACTMETADATA_VERSION_SLOT, 1)`.
    /// @param tokenName The token name.
    /// @param tokenSymbol The token symbol.
    function init(
        Layout storage s,
        string memory tokenName,
        string memory tokenSymbol
    ) internal {
        s.tokenName = tokenName;
        s.tokenSymbol = tokenSymbol;
    }

    function name(Layout storage s) internal view returns (string memory) {
        return s.tokenName;
    }

    function symbol(Layout storage s) internal view returns (string memory) {
        return s.tokenSymbol;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721CONTRACTMETADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
