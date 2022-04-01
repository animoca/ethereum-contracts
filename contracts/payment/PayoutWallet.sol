// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {PayoutWalletStorage} from "./libraries/PayoutWalletStorage.sol";
import {PayoutWalletBase} from "./PayoutWalletBase.sol";
import {Ownable} from "../access/Ownable.sol";

/// @title Payout wallet (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract PayoutWallet is PayoutWalletBase, Ownable {
    using PayoutWalletStorage for PayoutWalletStorage.Layout;

    /// @notice Initializes the storage with an initial payout wallet.
    /// @notice Sets the payout wallet storage version to `1`.
    /// @dev Reverts if the payout wallet storage is already initialized to version `1` or above.
    /// @dev Reverts if `initialPayoutWallet` is the zero address.
    /// @dev Emits a {PayoutWalletSet} event.
    /// @param initialPayoutWallet The initial payout wallet.
    constructor(address payable initialPayoutWallet) {
        PayoutWalletStorage.layout().init(initialPayoutWallet);
    }
}
