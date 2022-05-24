// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";

/// @title ERC721BurnableMock
contract ERC721BurnableMock is ERC721, ERC721Mintable, ERC721Burnable, ERC721TokenMetadataWithBaseURI {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_) {}
}
