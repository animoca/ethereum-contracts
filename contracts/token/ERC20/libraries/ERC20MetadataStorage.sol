// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Metadata} from "./../interfaces/IERC20Metadata.sol";
import {ProxyInitialization} from "./../../../proxy/libraries/ProxyInitialization.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC20MetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC20MetadataStorage for ERC20MetadataStorage.Layout;

    struct Layout {
        string uri;
    }

    bytes32 public constant ERC20METADATA_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Metadata.storage")) - 1);
    bytes32 public constant ERC20METADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Metadata.version")) - 1);

    /// @notice Initializes the storage with an initial token URI.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @param uri The token URI.
    function constructorInit(Layout storage s, string memory uri) internal {
        s.uri = uri;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Metadata).interfaceId, true);
    }

    /// @notice Initializes the storage with an initial token URI.
    /// @notice Sets the ERC20Metadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ERC20Metadata storage is already initialized to version `1` or above.
    /// @param uri The token URI.
    function proxyInit(Layout storage s, string memory uri) internal {
        ProxyInitialization.setPhase(ERC20METADATA_VERSION_SLOT, 1);
        s.constructorInit(uri);
    }

    function setTokenURI(Layout storage s, string memory uri) internal {
        s.uri = uri;
    }

    function tokenURI(Layout storage s) internal view returns (string memory) {
        return s.uri;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20METADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
