// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title
interface IPayoutWalletEvents {
    /// @notice Emitted when the payout wallet address changes.
    /// @param payoutWallet the new payout wallet address.
    event PayoutWalletSet(address payoutWallet);
}
