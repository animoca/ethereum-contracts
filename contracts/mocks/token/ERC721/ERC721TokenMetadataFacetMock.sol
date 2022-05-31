// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721TokenMetadataFacet} from "./../../../token/ERC721/ERC721TokenMetadataFacet.sol";

/// @title ERC721TokenMetadataFacetMock
contract ERC721TokenMetadataFacetMock is ERC721TokenMetadataFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721TokenMetadataFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
