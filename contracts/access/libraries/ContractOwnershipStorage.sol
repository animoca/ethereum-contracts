// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC173} from "./../interfaces/IERC173.sol";
import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";

library ContractOwnershipStorage {
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        address contractOwner;
    }

    bytes32 public constant CONTRACTOWNERSHIP_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.access.ContractOwnership.storage")) - 1);
    bytes32 public constant CONTRACTOWNERSHIP_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.access.ContractOwnership.version")) - 1);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Initializes the storage with an initial contract owner.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC173.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @dev Emits an {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner The initial contract owner.
    function constructorInit(Layout storage s, address initialOwner) internal {
        if (initialOwner != address(0)) {
            s.contractOwner = initialOwner;
            emit OwnershipTransferred(address(0), initialOwner);
        }
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC173).interfaceId, true);
    }

    /// @notice Initializes the storage with an initial contract owner.
    /// @notice Sets the ownership storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC173.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ownership storage is already initialized to version `1` or above.
    /// @dev Emits an {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner The initial contract owner.
    function proxyInit(Layout storage s, address initialOwner) internal {
        StorageVersion.setVersion(CONTRACTOWNERSHIP_VERSION_SLOT, 1);
        s.constructorInit(initialOwner);
    }

    /// @notice Sets the address of the new contract owner.
    /// @dev Reverts if `sender` is not the contract owner.
    /// @dev Emits an {OwnershipTransferred} event if `newOwner` is different from the current contract owner.
    /// @param newOwner The address of the new contract owner. Using the zero address means renouncing ownership.
    function transferOwnership(
        Layout storage s,
        address sender,
        address newOwner
    ) internal {
        address previousOwner = s.contractOwner;
        require(sender == previousOwner, "Ownership: not the owner");
        if (previousOwner != newOwner) {
            s.contractOwner = newOwner;
            emit OwnershipTransferred(previousOwner, newOwner);
        }
    }

    /// @notice Gets the address of the contract owner.
    /// @return contractOwner The address of the contract owner.
    function owner(Layout storage s) internal view returns (address contractOwner) {
        return s.contractOwner;
    }

    /// @notice Ensures that an account is the contract owner.
    /// @dev Reverts if `account` is not the contract owner.
    /// @param account The account.
    function enforceIsContractOwner(Layout storage s, address account) internal view {
        require(account == s.contractOwner, "Ownership: not the owner");
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = CONTRACTOWNERSHIP_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}