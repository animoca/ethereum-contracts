// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {OwnershipStorage} from "./../access/libraries/OwnershipStorage.sol";
import {PayoutWalletStorage} from "./libraries/PayoutWalletStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Payout wallet (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `PayoutWalletStorage.init` should be called during contract initialization.
/// @dev Note: This contract requires ERC173 (Contract Ownership standard).
abstract contract PayoutWalletBase is Context {
    using OwnershipStorage for OwnershipStorage.Layout;
    using PayoutWalletStorage for PayoutWalletStorage.Layout;

    /// @notice Emitted when the payout wallet address changes.
    /// @param payoutWallet the new payout wallet address.
    event PayoutWalletSet(address payoutWallet);

    /// @notice Gets the payout wallet.
    /// @return wallet The payout wallet.
    function payoutWallet() external view returns (address payable wallet) {
        return PayoutWalletStorage.layout().payoutWallet;
    }

    /// @notice Sets the payout wallet.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Reverts if `payoutWallet_` is the zero address.
    /// @dev Emits a {PayoutWalletSet} event.
    /// @param payoutWallet_ The payout wallet.
    function setPayoutWallet(address payable payoutWallet_) external {
        OwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        PayoutWalletStorage.layout().setPayoutWallet(payoutWallet_);
    }
}
