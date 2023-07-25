// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC173} from "./../interfaces/IERC173.sol";

library ContractOwnershipCheck {
    /// @notice Thrown when an account is not the owner of a target contract.
    /// @param tokenContract The contract that was checked.
    /// @param account The account that was checked.
    error NotTargetContractOwner(address tokenContract, address account);

    /// @notice Checks whether an account is the owner of a target contract.
    /// @param targetContract The contract to check.
    /// @param account The account to check.
    /// @return isOwner Whether `account` is the owner of `targetContract`.
    function isTargetContractOwner(address targetContract, address account) internal view returns (bool isOwner) {
        return IERC173(targetContract).owner() == account;
    }

    /// @notice Enforces that an account is the owner of a target contract.
    /// @dev Reverts with `NotTargetContractOwner` if the account is not the owner.
    /// @param targetContract The contract to check.
    /// @param account The account to check.
    function enforceIsTargetContractOwner(address targetContract, address account) internal view {
        if (!isTargetContractOwner(targetContract, account)) {
            revert NotTargetContractOwner(targetContract, account);
        }
    }
}
