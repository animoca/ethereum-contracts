// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20MintableFacet} from "./../../../token/ERC20/ERC20MintableFacet.sol";

contract ERC20MintableFacetMock is ERC20MintableFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC20MintableFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
