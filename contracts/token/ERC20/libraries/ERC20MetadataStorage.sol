// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Metadata} from "./../interfaces/IERC20Metadata.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC20MetadataStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        string tokenURI;
    }

    bytes32 public constant ERC20METADATA_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Metadata.storage")) - 1);
    bytes32 public constant ERC20METADATA_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Metadata.version")) - 1);

    /// @notice Initialises the storage with an initial token URI.
    /// @notice Sets the ERC20Metadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Reverts if the ERC20Metadata storage is already initialized to version `1` or above.
    /// @param uri The token URI.
    function init(Layout storage s, string memory uri) internal {
        StorageVersion.setVersion(ERC20METADATA_VERSION_SLOT, 1);
        s.tokenURI = uri;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Metadata).interfaceId, true);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20METADATA_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
