// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibPayoutWallet} from "./libraries/LibPayoutWallet.sol";
import {PayoutWalletBase} from "./PayoutWalletBase.sol";

/**
 * @title Payout wallet (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 * @dev Note: This facet depends on {OwnableFacet}.
 */
contract PayoutWalletFacet is PayoutWalletBase {
    function initPayoutWalletStorage(address payable payoutWallet_) external {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibPayoutWallet.initPayoutWalletStorage(payoutWallet_);
    }
}
