// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ITokenMetadataResolver} from "./../../../../token/metadata/interfaces/ITokenMetadataResolver.sol";
import {ERC721FullBurn} from "./../../../../token/ERC721/preset/ERC721FullBurn.sol";

/// @title ERC721FullBurnMock
contract ERC721FullBurnMock is ERC721FullBurn {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        ITokenMetadataResolver metadataResolver,
        IForwarderRegistry forwarderRegistry
    ) ERC721FullBurn(tokenName, tokenSymbol, metadataResolver, forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
