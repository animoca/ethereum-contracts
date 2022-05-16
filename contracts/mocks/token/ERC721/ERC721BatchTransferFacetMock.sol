// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721BatchTransferFacet} from "./../../../token/ERC721/ERC721BatchTransferFacet.sol";

contract ERC721BatchTransferFacetMock is ERC721BatchTransferFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC721BatchTransferFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}