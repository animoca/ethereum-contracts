// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155WithOperatorFiltererFacet} from "./../../../../token/ERC1155/facets/ERC1155WithOperatorFiltererFacet.sol";

/// @title ERC1155FacetMock
contract ERC1155WithOperatorFiltererFacetMock is ERC1155WithOperatorFiltererFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155WithOperatorFiltererFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
