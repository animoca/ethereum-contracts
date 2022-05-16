// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721MintableOnceFacet} from "./../../../token/ERC721/ERC721MintableOnceFacet.sol";

contract ERC721MintableOnceFacetMock is ERC721MintableOnceFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721MintableOnceFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}