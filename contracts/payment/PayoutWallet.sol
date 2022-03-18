// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPayoutWallet} from "./libraries/LibPayoutWallet.sol";
import {PayoutWalletBase} from "./PayoutWalletBase.sol";
import {Ownable} from "../access/Ownable.sol";

/**
 * @title Payout wallet (immutable version).
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract PayoutWallet is PayoutWalletBase, Ownable {
    constructor(address payable payoutWallet_) {
        LibPayoutWallet.initPayoutWalletStorage(payoutWallet_);
    }
}
