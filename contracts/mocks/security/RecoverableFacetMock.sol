// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {RecoverableFacet} from "./../../security/RecoverableFacet.sol";

contract RecoverableFacetMock is RecoverableFacet {
    constructor(IForwarderRegistry forwarderRegistry) RecoverableFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
