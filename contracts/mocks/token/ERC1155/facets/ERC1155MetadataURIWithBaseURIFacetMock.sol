// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155MetadataURIWithBaseURIFacet} from "./../../../../token/ERC1155/facets/ERC1155MetadataURIWithBaseURIFacet.sol";

contract ERC1155MetadataURIWithBaseURIFacetMock is ERC1155MetadataURIWithBaseURIFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155MetadataURIWithBaseURIFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
