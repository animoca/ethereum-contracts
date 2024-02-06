// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ITokenMetadataResolver} from "./../../../../token/metadata/interfaces/ITokenMetadataResolver.sol";
import {ERC1155FullBurn} from "./../../../../token/ERC1155/preset/ERC1155FullBurn.sol";

/// @title ERC1155FullBurnMock
contract ERC1155FullBurnMock is ERC1155FullBurn {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        ITokenMetadataResolver metadataResolver,
        IForwarderRegistry forwarderRegistry
    ) ERC1155FullBurn(tokenName, tokenSymbol, metadataResolver, forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
