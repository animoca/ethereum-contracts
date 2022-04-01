// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC165} from "./../interfaces/IERC165.sol";
import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

library InterfaceDetectionStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        mapping(bytes4 => bool) supportedInterfaces;
    }

    bytes32 public constant INTERFACEDETECTION_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.introspection.InterfaceDetection.storage")) - 1);
    bytes32 public constant INTERFACEDETECTION_VERSION_SLOT = bytes32(uint256(keccak256("animoca.introspection.InterfaceDetection.version")) - 1);

    /// @notice Initialises the storage.
    /// @notice Sets the interface detection storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC165.
    /// @dev Reverts if the interface detection storage is already initialized to version `1` or above.
    function init(Layout storage s) internal {
        StorageVersion.setVersion(INTERFACEDETECTION_VERSION_SLOT, 1);
        s.setSupportedInterface(type(IERC165).interfaceId, true);
    }

    /// @notice Sets or unsets an ERC165 interface.
    /// @dev Reverts if `interfaceId` is `0xffffffff`.
    /// @param interfaceId the interface identifier.
    /// @param supported True to set the interface, false to unset it.
    function setSupportedInterface(
        Layout storage s,
        bytes4 interfaceId,
        bool supported
    ) internal {
        require(interfaceId != 0xffffffff, "InterfaceDetection: wrong value");
        s.supportedInterfaces[interfaceId] = supported;
    }

    /// @notice Returns whether this contract implements a given interface.
    /// @dev Note: This function call must use less than 30 000 gas.
    /// @param interfaceId The interface identifier to test.
    /// @return supported True if the interface is supported, false if `interfaceId` is `0xffffffff` or if the interface is not supported.
    function supportsInterface(Layout storage s, bytes4 interfaceId) internal view returns (bool supported) {
        return s.supportedInterfaces[interfaceId];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = INTERFACEDETECTION_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
