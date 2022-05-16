// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721BurnableFacet} from "./../../../token/ERC721/ERC721BurnableFacet.sol";

contract ERC721BurnableFacetMock is ERC721BurnableFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721BurnableFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}