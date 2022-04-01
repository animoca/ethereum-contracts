// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {PayoutWalletStorage} from "./libraries/PayoutWalletStorage.sol";
import {PayoutWalletBase} from "./PayoutWalletBase.sol";

/// @title Payout wallet (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {OwnableFacet}.
contract PayoutWalletFacet is PayoutWalletBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using PayoutWalletStorage for PayoutWalletStorage.Layout;

    /// @notice Initializes the storage with an initial payout wallet.
    /// @notice Sets the payout wallet storage version to `1`.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the payout wallet storage is already initialized to version `1` or above.
    /// @dev Reverts if `initialPayoutWallet` is the zero address.
    /// @dev Emits a {PayoutWalletSet} event.
    /// @param initialPayoutWallet The initial payout wallet.
    function initPayoutWalletStorage(address payable initialPayoutWallet) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        PayoutWalletStorage.layout().init(initialPayoutWallet);
    }
}
