// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// This contract has been derived from wighawag/universal-forwarder
// See https://github.com/wighawag/universal-forwarder/blob/5e16fad4d7bb99a7d4f32599787a6e240396d47c/src/solc_0.7/ERC2771/IForwarderRegistry.sol
/// @title Universal Meta-Transactions Forwarder Registry.
interface IForwarderRegistry {
    /// @notice Checks whether an account is as a meta-transaction forwarder for a signer account.
    /// @param forwarder The signer account.
    /// @param forwarder The forwarder account.
    /// @return isForwarder True if `forwarder` is a meta-transaction forwarder for `signer`, false otherwise.
    function isForwarderFor(address signer, address forwarder) external view returns (bool isForwarder);
}
