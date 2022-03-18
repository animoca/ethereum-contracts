// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";
import {IERC165} from "./../interfaces/IERC165.sol";

library LibInterfaceDetection {
    bytes32 public constant INTERFACEDETECTION_STORAGE_POSITION = keccak256("animoca.core.interfacedetection.storage");
    bytes32 public constant INTERFACEDETECTION_VERSION_SLOT = keccak256("animoca.core.interfacedetection.storage.version");

    struct InterfaceDetectionStorage {
        mapping(bytes4 => bool) supportedInterfaces;
    }

    function interfaceDetectionStorage() internal pure returns (InterfaceDetectionStorage storage s) {
        bytes32 position = INTERFACEDETECTION_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function initInterfaceDetectionStorage() internal {
        StorageVersion.setVersion(INTERFACEDETECTION_VERSION_SLOT, 1);
        setSupportedInterface(type(IERC165).interfaceId, true);
    }

    function supportsInterface(bytes4 interfaceId) internal view returns (bool) {
        return interfaceDetectionStorage().supportedInterfaces[interfaceId];
    }

    function setSupportedInterface(bytes4 interfaceId, bool supported) internal {
        require(interfaceId != 0xffffffff, "InterfaceDetection: wrong value");
        interfaceDetectionStorage().supportedInterfaces[interfaceId] = supported;
    }
}
