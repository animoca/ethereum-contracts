// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721MintableFacet} from "./../../../token/ERC721/ERC721MintableFacet.sol";

contract ERC721MintableFacetMock is ERC721MintableFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721MintableFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}