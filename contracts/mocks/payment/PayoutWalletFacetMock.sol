// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {PayoutWalletFacet} from "./../../payment/PayoutWalletFacet.sol";

contract PayoutWalletFacetMock is PayoutWalletFacet {
    constructor(IForwarderRegistry forwarderRegistry) PayoutWalletFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
