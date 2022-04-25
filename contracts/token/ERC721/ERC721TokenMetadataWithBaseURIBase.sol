// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";

abstract contract ERC721TokenMetadataWithBaseURIBase is Context, IERC721Metadata {
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;

    constructor(string memory name_, string memory symbol_, string memory tokenURI_){
        ERC721TokenMetadataWithBaseURIStorage.layout().init(name_, symbol_, tokenURI_);
    }
}