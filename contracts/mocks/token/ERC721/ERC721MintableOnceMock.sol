// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721MintableOnce} from "./../../../token/ERC721/ERC721MintableOnce.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {Ownable} from "./../../../access/Ownable.sol";


/// @title ERC721MintableOnceFacetMock
contract ERC721MintableOnceMock is ERC721, ERC721MintableOnce, ERC721Burnable, ERC721TokenMetadataWithBaseURI {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_) ERC721MintableOnce() ERC721Burnable() Ownable(msg.sender) {}
}
