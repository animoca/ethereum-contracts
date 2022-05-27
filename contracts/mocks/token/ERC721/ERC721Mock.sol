// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721SimpleMock} from "./ERC721SimpleMock.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721BatchTransfer} from "./../../../token/ERC721/ERC721BatchTransfer.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {Ownable} from "./../../../access/Ownable.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721Mock
contract ERC721Mock is ERC721SimpleMock, ERC721BatchTransfer, ERC721TokenMetadataWithBaseURI {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_) ERC721SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ERC721SimpleMock) returns (address) {
        return ERC721SimpleMock._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ERC721SimpleMock) returns (bytes calldata) {
        return ERC721SimpleMock._msgData();
    }
}
