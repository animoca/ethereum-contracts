// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721MetadataWithBaseURIFacet} from "./../../../token/ERC721/ERC721MetadataWithBaseURIFacet.sol";

contract ERC721MetadataWithBaseURIFacetMock is ERC721MetadataWithBaseURIFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721MetadataWithBaseURIFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
