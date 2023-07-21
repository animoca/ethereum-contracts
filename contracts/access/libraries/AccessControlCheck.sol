// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IAccessControl} from "./../interfaces/IAccessControl.sol";

library AccessControlCheck {
    /// @notice Thrown when an account does not have the required role.
    /// @param targetContract The contract that was checked.
    /// @param role The role that was checked.
    /// @param account The account that was checked.
    error NotTargetContractRoleHolder(address targetContract, bytes32 role, address account);

    /// @notice Checks whether an account has a role in a target contract.
    /// @param targetContract The contract to check.
    /// @param role The role to check.
    /// @param account The account to check.
    /// @return hasRole Whether `account` has `role` in `targetContract`.
    function hasTargetContractRole(address targetContract, bytes32 role, address account) internal view returns (bool hasRole) {
        return IAccessControl(targetContract).hasRole(role, account);
    }

    /// @notice Enforces that an account has a role in a target contract.
    /// @dev Reverts with `NotTargetContractRoleHolder` if the account does not have the role.
    /// @param targetContract The contract to check.
    /// @param role The role to check.
    /// @param account The account to check.
    function enforceHasTargetContractRole(address targetContract, bytes32 role, address account) internal view {
        if (!hasTargetContractRole(targetContract, role, account)) {
            revert NotTargetContractRoleHolder(targetContract, role, account);
        }
    }
}
