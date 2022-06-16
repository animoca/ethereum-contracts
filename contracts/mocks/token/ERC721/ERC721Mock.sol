// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721SimpleMock} from "./ERC721SimpleMock.sol";
import {ERC721Deliverable} from "./../../../token/ERC721/ERC721Deliverable.sol";
import {ERC721BatchTransfer} from "./../../../token/ERC721/ERC721BatchTransfer.sol";
import {ERC721MetadataWithBaseURI} from "./../../../token/ERC721/ERC721MetadataWithBaseURI.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721Mock
contract ERC721Mock is ERC721SimpleMock, ERC721Deliverable, ERC721BatchTransfer, ERC721MetadataWithBaseURI {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        string memory baseMetadataURI,
        IForwarderRegistry forwarderRegistry
    ) ERC721MetadataWithBaseURI(tokenName, tokenSymbol, baseMetadataURI) ERC721SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ERC721SimpleMock
    function _msgSender() internal view virtual override(Context, ERC721SimpleMock) returns (address) {
        return ERC721SimpleMock._msgSender();
    }

    /// @inheritdoc ERC721SimpleMock
    function _msgData() internal view virtual override(Context, ERC721SimpleMock) returns (bytes calldata) {
        return ERC721SimpleMock._msgData();
    }
}
