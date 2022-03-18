// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Bytes32} from "./../../utils/libraries/Bytes32.sol";

library LibAccessControl {
    using Bytes32 for bytes32;

    event RoleGranted(bytes32 role, address account, address operator);
    event RoleRevoked(bytes32 role, address account, address operator);

    bytes32 public constant ACCESSCONTROL_STORAGE_POSITION = keccak256("animoca.core.accesscontrol.storage");

    struct AccessControlStorage {
        mapping(bytes32 => mapping(address => bool)) roles;
    }

    function accessControlStorage() internal pure returns (AccessControlStorage storage s) {
        bytes32 position = ACCESSCONTROL_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * Retrieves whether an `account` has a `role`.
     * @param role The role.
     * @param account The account.
     * @return whether `account` has `role`.
     */
    function hasRole(bytes32 role, address account) internal view returns (bool) {
        return _hasRole(accessControlStorage(), role, account);
    }

    /**
     * Ensures that an `account` has a `role`.
     * @dev reverts if the `account` does not have the `role`.
     * @param role The role.
     * @param account The account.
     */
    function enforceHasRole(bytes32 role, address account) internal view {
        _enforceHasRole(accessControlStorage(), role, account);
    }

    /**
     * Grants a `role` to an `account`.
     * @dev emits a {RoleGranted} event if the `account` did not previously have the `role`.
     * @param role The role to grant.
     * @param account The account to grant the role to.
     * @param operator The account requesting the role change.
     */
    function grantRole(
        bytes32 role,
        address account,
        address operator
    ) internal {
        AccessControlStorage storage s = accessControlStorage();
        if (!_hasRole(s, role, account)) {
            s.roles[role][account] = true;
            emit RoleGranted(role, account, operator);
        }
    }

    /**
     * Revokes a `role` from an `account`.
     * @dev emits a {RoleRevoked} event if the `account` previously had the `role`.
     * @param role The role to revoke.
     * @param account The account to revoke the role from.
     * @param operator The account requesting the role change.
     */
    function revokeRole(
        bytes32 role,
        address account,
        address operator
    ) internal {
        AccessControlStorage storage s = accessControlStorage();
        if (_hasRole(s, role, account)) {
            s.roles[role][account] = false;
            emit RoleRevoked(role, account, operator);
        }
    }

    /**
     * Renounces a `role` by the `sender`.
     * @dev reverts if the `sender` does not have the `role`.
     * @dev emits a {RoleRevoked} event.
     * @param role The role to renounced.
     * @param sender The message sender.
     */
    function renounceRole(bytes32 role, address sender) internal {
        AccessControlStorage storage s = accessControlStorage();
        _enforceHasRole(s, role, sender);
        s.roles[role][sender] = false;
        emit RoleRevoked(role, sender, sender);
    }

    function _hasRole(
        AccessControlStorage storage s,
        bytes32 role,
        address account
    ) private view returns (bool) {
        return s.roles[role][account];
    }

    function _enforceHasRole(
        AccessControlStorage storage s,
        bytes32 role,
        address account
    ) private view {
        if (!_hasRole(s, role, account)) {
            revert(string(abi.encodePacked("AccessControl: missing '", role.toASCIIString(), "' role")));
        }
    }
}
