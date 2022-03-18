// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";
import {LibInterfaceDetection} from "./../../introspection/libraries/LibInterfaceDetection.sol";
import {IERC173} from "./../interfaces/IERC173.sol";

library LibOwnership {
    /**
     * Event emited when ownership of a contract changes.
     * @param previousOwner the previous owner.
     * @param newOwner the new owner.
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    bytes32 public constant OWNERSHIP_STORAGE_POSITION = keccak256("animoca.core.ownership.storage");
    bytes32 public constant OWNERSHIP_VERSION_SLOT = keccak256("animoca.core.ownership.storage.version");

    struct OwnershipStorage {
        address contractOwner;
    }

    function ownershipStorage() internal pure returns (OwnershipStorage storage s) {
        bytes32 position = OWNERSHIP_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function initOwnershipStorage(address initialOwner) internal {
        StorageVersion.setVersion(OWNERSHIP_VERSION_SLOT, 1);
        if (initialOwner != address(0)) {
            ownershipStorage().contractOwner = initialOwner;
            emit OwnershipTransferred(address(0), initialOwner);
        }
        LibInterfaceDetection.setSupportedInterface(type(IERC173).interfaceId, true);
    }

    function owner() internal view returns (address) {
        return ownershipStorage().contractOwner;
    }

    function enforceIsContractOwner(address account) internal view {
        require(account == ownershipStorage().contractOwner, "Ownership: not the owner");
    }

    function transferOwnership(address newOwner, address sender) internal {
        OwnershipStorage storage s = ownershipStorage();
        address previousOwner = s.contractOwner;
        require(sender == previousOwner, "Ownership: not the owner");
        if (previousOwner != newOwner) {
            s.contractOwner = newOwner;
            emit OwnershipTransferred(previousOwner, newOwner);
        }
    }
}
