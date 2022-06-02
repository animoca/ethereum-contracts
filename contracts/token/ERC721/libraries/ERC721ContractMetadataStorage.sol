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
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @param tokenName The Non-Fungible token name.
    /// @param tokenSymbol The Non-Fungible token symbol.
    function constructorInit(
        Layout storage s,
        string memory tokenName,
        string memory tokenSymbol
    ) internal {
        s.tokenName = tokenName;
        s.tokenSymbol = tokenSymbol;
    }

    /// @notice Initialises the storage with a name and symbol.
    /// @notice Sets the ERC721ContractMetadata storage version to `1`.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ERC721ContractMetadata storage is already initialized to version `1` or above.
    /// @param tokenName The Non-Fungible token name.
    /// @param tokenSymbol The Non-Fungible token symbol.
    function proxyInit(
        Layout storage s,
        string memory tokenName,
        string memory tokenSymbol
    ) internal {
        StorageVersion.setVersion(ERC721CONTRACTMETADATA_VERSION_SLOT, 1);
        s.constructorInit(tokenName, tokenSymbol);
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
