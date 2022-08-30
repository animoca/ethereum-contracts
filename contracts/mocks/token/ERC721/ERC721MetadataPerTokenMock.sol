// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721MetadataPerToken} from "./../../../token/ERC721/ERC721MetadataPerToken.sol";
import {ERC721SimpleMock} from "./ERC721SimpleMock.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721TokenMetadataMock
contract ERC721MetadataPerTokenMock is ERC721SimpleMock, ERC721MetadataPerToken {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        IForwarderRegistry forwarderRegistry
    ) ERC721MetadataPerToken(tokenName, tokenSymbol) ERC721SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ERC721SimpleMock
    function _msgSender() internal view virtual override(Context, ERC721SimpleMock) returns (address) {
        return ERC721SimpleMock._msgSender();
    }

    /// @inheritdoc ERC721SimpleMock
    function _msgData() internal view virtual override(Context, ERC721SimpleMock) returns (bytes calldata) {
        return ERC721SimpleMock._msgData();
    }
}
