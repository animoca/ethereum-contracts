// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Burnable} from "./interfaces/IERC721Burnable.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

abstract contract ERC721BurnableBase is Context, IERC721Burnable {
    using ERC721Storage for ERC721Storage.Layout;

    function burnFrom(
        address from, 
        uint256 tokenId) public virtual override {
            ERC721Storage.layout().burnFrom(_msgSender(), from, tokenId);
        }

    function batchBurnFrom(
        address from, 
        uint256[] memory tokenIds) public virtual override {
            ERC721Storage.layout().batchBurnFrom(_msgSender(), from, tokenIds);
        }
}