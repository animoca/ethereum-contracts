// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721TokenMetadataWithBaseURIFacet} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURIFacet.sol";

/// @title ERC721TokenMetadataWithBaseURIFacetMock
contract ERC721TokenMetadataWithBaseURIFacetMock is ERC721TokenMetadataWithBaseURIFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721TokenMetadataWithBaseURIFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}