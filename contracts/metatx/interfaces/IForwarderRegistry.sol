// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @title Universal Meta-Transactions Forwarder Registry.
interface IForwarderRegistry {
    /// @notice Checks whether an account is as a meta-transaction forwarder for a signer account.
    /// @param forwarder The signer account.
    /// @param forwarder The forwarder account.
    /// @return isForwarder True if `forwarder` is a meta-transaction forwarder for `signer`, false otherwise.
    function isForwarderFor(address signer, address forwarder) external view returns (bool isForwarder);
}
