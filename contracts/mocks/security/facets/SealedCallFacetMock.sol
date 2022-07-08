// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {SealedCallFacet} from "./../../../security/facets/SealedCallFacet.sol";

contract SealedCallFacetMock is SealedCallFacet {
    constructor(IForwarderRegistry forwarderRegistry) SealedCallFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
