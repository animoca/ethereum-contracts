// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721MetadataPerTokenFacet} from "./../../../../token/ERC721/facets/ERC721MetadataPerTokenFacet.sol";

contract ERC721MetadataPerTokenFacetMock is ERC721MetadataPerTokenFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721MetadataPerTokenFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
