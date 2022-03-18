// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PayoutWallet} from "./../../payment/PayoutWallet.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract PayoutWalletMock is PayoutWallet {
    constructor(address payable payoutWallet_) PayoutWallet(payoutWallet_) Ownable(msg.sender) {}
}
