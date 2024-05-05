// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Meta-Transactions Forwarder Registry.
interface IForwarderRegistry {
    /// @notice Checks whether an account is as an approved meta-transaction forwarder for a sender account to a target contract.
    /// @param sender The sender account.
    /// @param forwarder The forwarder account.
    /// @param target The target contract.
    /// @return isApproved True if `forwarder` is an approved meta-transaction forwarder for `sender` to `target`, false otherwise.
    function isApprovedForwarder(address sender, address forwarder, address target) external view returns (bool isApproved);
}
