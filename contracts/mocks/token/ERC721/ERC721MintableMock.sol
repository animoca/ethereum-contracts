// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {Ownable} from "./../../../access/Ownable.sol";

contract ERC721MintableMock is ERC721, ERC721Mintable, ERC721Burnable {
    constructor(string memory name_, string memory symbol_, string memory tokenURI_) ERC721Mintable() ERC721Burnable() {}
}