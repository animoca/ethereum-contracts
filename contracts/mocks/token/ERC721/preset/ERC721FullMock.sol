// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ITokenMetadataResolver} from "./../../../../token/metadata/interfaces/ITokenMetadataResolver.sol";
import {ERC721Full} from "./../../../../token/ERC721/preset/ERC721Full.sol";

/// @title ERC721FullMock
contract ERC721FullMock is ERC721Full {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        ITokenMetadataResolver metadataResolver,
        IForwarderRegistry forwarderRegistry
    ) ERC721Full(tokenName, tokenSymbol, metadataResolver, forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
