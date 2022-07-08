// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {SealedDelegateCallFacet} from "./../../../security/facets/SealedDelegateCallFacet.sol";

contract SealedDelegateCallFacetMock is SealedDelegateCallFacet {
    constructor(IForwarderRegistry forwarderRegistry) SealedDelegateCallFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
