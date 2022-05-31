// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721BatchTransfer} from "./../../../token/ERC721/ERC721BatchTransfer.sol";
import {ERC721TokenMetadata} from "./../../../token/ERC721/ERC721TokenMetadata.sol";
import {ERC721SimpleMock} from "./ERC721SimpleMock.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC721TokenMetadataMock
contract ERC721TokenMetadataMock is ERC721SimpleMock, ERC721TokenMetadata {
    constructor(
        string memory name_,
        string memory symbol_,
        IForwarderRegistry forwarderRegistry
    ) ERC721TokenMetadata(name_, symbol_) ERC721SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ERC721SimpleMock) returns (address) {
        return ERC721SimpleMock._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ERC721SimpleMock) returns (bytes calldata) {
        return ERC721SimpleMock._msgData();
    }
}
