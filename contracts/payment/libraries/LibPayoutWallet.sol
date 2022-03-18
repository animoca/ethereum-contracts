// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

import "hardhat/console.sol";

library LibPayoutWallet {
    /**
     * Emitted when the payout wallet address changes.
     * @param payoutWallet the new payout wallet address.
     */
    event PayoutWalletSet(address payoutWallet);

    bytes32 public constant PAYOUTWALLET_STORAGE_POSITION = keccak256("animoca.core.payment.payoutwallet.storage");
    bytes32 public constant PAYOUTWALLET_VERSION_SLOT = keccak256("animoca.core.payment.payoutwallet.version");

    struct PayoutWalletStorage {
        bool initialized;
        address payable payoutWallet;
    }

    function payoutWalletStorage() internal pure returns (PayoutWalletStorage storage s) {
        bytes32 position = PAYOUTWALLET_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function initPayoutWalletStorage(address payable payoutWallet_) internal {
        StorageVersion.setVersion(PAYOUTWALLET_VERSION_SLOT, 1);
        setPayoutWallet(payoutWallet_);
    }

    function payoutWallet() internal view returns (address payable) {
        return payoutWalletStorage().payoutWallet;
    }

    function setPayoutWallet(address payable payoutWallet_) internal {
        require(payoutWallet_ != address(0), "PayoutWallet: zero address");
        payoutWalletStorage().payoutWallet = payoutWallet_;
        emit PayoutWalletSet(payoutWallet_);
    }
}
