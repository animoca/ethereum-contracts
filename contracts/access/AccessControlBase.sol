// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibAccessControl} from "./libraries/LibAccessControl.sol";
import {LibOwnership} from "./libraries/LibOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Access control via roles management (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev Note: This contract requires ERC173 (Contract Ownership standard).
 */
abstract contract AccessControlBase is Context {
    /**
     * Retrieves whether an `account` has a `role`.
     * @param role The role.
     * @param account The account.
     * @return whether `account` has `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool) {
        return LibAccessControl.hasRole(role, account);
    }

    /**
     * Grants a `role` to an `account`.
     * @dev reverts if the sender is not the contract owner.
     * @dev emits a {RoleGranted} event if the `account` did not previously have the `role`.
     * @param role The role to grant.
     * @param account The account to grant the role to.
     */
    function grantRole(bytes32 role, address account) external {
        address operator = _msgSender();
        LibOwnership.enforceIsContractOwner(operator);
        LibAccessControl.grantRole(role, account, operator);
    }

    /**
     * Revokes a `role` from an `account`.
     * @dev emits a {RoleRevoked} event if the `account` previously had the `role`.
     * @param role The role to revoke.
     * @param account The account to revoke the role from.
     */
    function revokeRole(bytes32 role, address account) external {
        address operator = _msgSender();
        LibOwnership.enforceIsContractOwner(operator);
        LibAccessControl.revokeRole(role, account, operator);
    }

    /**
     * Renounces a `role` by the sender.
     * @dev reverts if the sender does not have the `role`.
     * @dev emits a {RoleRevoked} event.
     * @param role The role to renounced.
     */
    function renounceRole(bytes32 role) external {
        LibAccessControl.renounceRole(role, _msgSender());
    }
}
