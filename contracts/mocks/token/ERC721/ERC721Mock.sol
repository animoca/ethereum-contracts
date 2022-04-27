// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721TokenMetadataWithBaseURIBase} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURIBase.sol";

// TODO: Add mint interface

contract ERC721Mock is ERC721, ERC721Mintable, ERC721TokenMetadataWithBaseURIBase {
    constructor(string memory name_, string memory symbol_, string memory tokenURI_) ERC721TokenMetadataWithBaseURIBase(name_, symbol_, tokenURI_) {}
}