// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @title Access control via roles management.
interface IAccessControl {
    /// @notice Retrieves whether an account has a role.
    /// @param role The role.
    /// @param account The account.
    /// @return hasRole_ Whether `account` has `role`.
    function hasRole(bytes32 role, address account) external view returns (bool hasRole_);
}
