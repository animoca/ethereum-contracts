// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./../access/libraries/LibOwnership.sol";
import {LibPayoutWallet} from "./libraries/LibPayoutWallet.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Payout wallet (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibPayoutWallet.initPayoutWalletStorage(payoutWallet_)` should be called during contract initialisation.
 * @dev Note: This contract requires ERC173 (Contract Ownership standard).
 */
abstract contract PayoutWalletBase is Context {
    function payoutWallet() external view returns (address payable) {
        return LibPayoutWallet.payoutWallet();
    }

    function setPayoutWallet(address payable payoutWallet_) external {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibPayoutWallet.setPayoutWallet(payoutWallet_);
    }
}
