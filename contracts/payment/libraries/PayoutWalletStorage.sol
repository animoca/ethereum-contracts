// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {StorageVersion} from "./../../proxy/libraries/StorageVersion.sol";

library PayoutWalletStorage {
    using PayoutWalletStorage for PayoutWalletStorage.Layout;

    struct Layout {
        address payable payoutWallet;
    }

    bytes32 public constant PAYOUTWALLET_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.payment.PayoutWallet.storage")) - 1);
    bytes32 public constant PAYOUTWALLET_VERSION_SLOT = bytes32(uint256(keccak256("animoca.payment.PayoutWallet.version")) - 1);

    event PayoutWalletSet(address payoutWallet);

    /// @notice Initializes the storage with an initial payout wallet.
    /// @notice Sets the payout wallet storage version to `1`.
    /// @dev Reverts if the payout wallet storage is already initialized to version `1` or above.
    /// @dev Reverts if `initialPayoutWallet` is the zero address.
    /// @dev Emits a {PayoutWalletSet} event.
    /// @param initialPayoutWallet The initial payout wallet.
    function init(Layout storage s, address payable initialPayoutWallet) internal {
        StorageVersion.setVersion(PAYOUTWALLET_VERSION_SLOT, 1);
        s.setPayoutWallet(initialPayoutWallet);
    }

    /// @notice Sets the payout wallet.
    /// @dev Reverts if `payoutWallet_` is the zero address.
    /// @dev Emits a {PayoutWalletSet} event.
    /// @param newPayoutWallet The payout wallet.
    function setPayoutWallet(Layout storage s, address payable newPayoutWallet) internal {
        require(newPayoutWallet != address(0), "PayoutWallet: zero address");
        s.payoutWallet = newPayoutWallet;
        emit PayoutWalletSet(newPayoutWallet);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = PAYOUTWALLET_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
