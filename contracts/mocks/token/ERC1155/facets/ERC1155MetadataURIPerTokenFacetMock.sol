// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155MetadataURIPerTokenFacet} from "./../../../../token/ERC1155/facets/ERC1155MetadataURIPerTokenFacet.sol";

contract ERC1155MetadataURIPerTokenFacetMock is ERC1155MetadataURIPerTokenFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155MetadataURIPerTokenFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
