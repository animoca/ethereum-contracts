// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Mock} from "./ERC721Mock.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721BurnableMock
contract ERC721BurnableMock is ERC721Mock {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC721Mock(name_, symbol_, tokenURI_, forwarderRegistry) {}

}
