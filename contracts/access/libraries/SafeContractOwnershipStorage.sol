// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {NotContractOwner, NotPendingContractOwner, NotTargetContractOwner} from "./../errors/ContractOwnershipErrors.sol";
import {TargetIsNotAContract} from "./../errors/Common.sol";
import {OwnershipTransferred, OwnershipTransferPending} from "./../events/ERC173Events.sol";
import {IERC173} from "./../interfaces/IERC173.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ProxyInitialization} from "./../../proxy/libraries/ProxyInitialization.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";

library SafeContractOwnershipStorage {
    using Address for address;
    using SafeContractOwnershipStorage for SafeContractOwnershipStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        address contractOwner;
        address pendingContractOwner;
    }

    bytes32 internal constant LAYOUT_STORAGE_SLOT = bytes32(uint256(keccak256("animoca.core.access.SafeContractOwnership.storage")) - 1);
    bytes32 internal constant PROXY_INIT_PHASE_SLOT = bytes32(uint256(keccak256("animoca.core.access.SafeContractOwnership.phase")) - 1);

    /// @notice Initializes the storage with an initial contract owner (immutable version).
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

    /// @notice Initializes the storage with an initial contract owner (proxied version).
    /// @notice Sets the proxy initialization phase to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC173.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts with {InitializationPhaseAlreadyReached} if the proxy initialization phase is set to `1` or above.
    /// @dev Emits an {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner The initial contract owner.
    function proxyInit(Layout storage s, address initialOwner) internal {
        ProxyInitialization.setPhase(PROXY_INIT_PHASE_SLOT, 1);
        s.constructorInit(initialOwner);
    }

    /// @notice Sets an address as the pending new contract owner.
    /// @dev Reverts with {NotContractOwner} if `sender` is not the contract owner.
    /// @dev Emits an {OwnershipTransferred} event if `newOwner` is the zero address.
    /// @dev Emits an {OwnershipTransferPending} event if `newOwner` not the zero address and not the current contract owner.
    /// @param newOwner The address of the new contract owner. Using the zero address means renouncing ownership.
    function transferOwnership(Layout storage s, address sender, address newOwner) internal {
        address currentOwner = s.contractOwner;
        if (sender != currentOwner) revert NotContractOwner(sender);
        if (newOwner == address(0)) {
            s.contractOwner = address(0);
            s.pendingContractOwner = address(0);
            emit OwnershipTransferred(currentOwner, address(0));
        } else {
            if (currentOwner != newOwner) {
                s.pendingContractOwner = newOwner;
                emit OwnershipTransferPending(newOwner);
            }
        }
    }

    /// @notice Sets the pending contract owner as the new contract owner.
    /// @dev Reverts with {NotPendingContractOwner} if `sender` is not the pending contract owner.
    /// @dev Emits an {OwnershipTransferred} event.
    function acceptOwnership(Layout storage s, address sender) internal {
        address pendingContractOwner = s.pendingContractOwner;
        if (sender != pendingContractOwner) revert NotPendingContractOwner(sender);
        emit OwnershipTransferred(s.contractOwner, pendingContractOwner);
        s.contractOwner = pendingContractOwner;
        s.pendingContractOwner = address(0);
    }

    /// @notice Gets the address of the contract owner.
    /// @return contractOwner The address of the contract owner.
    function owner(Layout storage s) internal view returns (address contractOwner) {
        return s.contractOwner;
    }

    /// @notice Gets the address of the pending contract owner.
    /// @return pendingContractOwner The address of the pending contract owner.
    function pendingOwner(Layout storage s) internal view returns (address pendingContractOwner) {
        return s.pendingContractOwner;
    }

    /// @notice Checks whether an account is the owner of a target contract.
    /// @param targetContract The contract to check.
    /// @param account The account to check.
    /// @return isTargetContractOwner_ Whether `account` is the owner of `targetContract`.
    function isTargetContractOwner(address targetContract, address account) internal view returns (bool isTargetContractOwner_) {
        if (!targetContract.isContract()) revert TargetIsNotAContract(targetContract);
        return IERC173(targetContract).owner() == account;
    }

    /// @notice Ensures that an account is the contract owner.
    /// @dev Reverts with {NotContractOwner} if `account` is not the contract owner.
    /// @param account The account.
    function enforceIsContractOwner(Layout storage s, address account) internal view {
        if (account != s.contractOwner) revert NotContractOwner(account);
    }

    /// @notice Enforces that an account is the owner of a target contract.
    /// @dev Reverts with {NotTheTargetContractOwner} if the account is not the owner.
    /// @param targetContract The contract to check.
    /// @param account The account to check.
    function enforceIsTargetContractOwner(address targetContract, address account) internal view {
        if (!isTargetContractOwner(targetContract, account)) revert NotTargetContractOwner(targetContract, account);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = LAYOUT_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }
}
