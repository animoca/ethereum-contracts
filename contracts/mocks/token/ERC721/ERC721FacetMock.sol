// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721Facet} from "./../../../token/ERC721/ERC721Facet.sol";

contract ERC721FacetMock is ERC721Facet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721Facet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}