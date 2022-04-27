// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Mintable} from "./interfaces/IERC721Mintable.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

abstract contract ERC721MintableBase is Context, IERC721Mintable {
    using ERC721Storage for ERC721Storage.Layout;

    function mint(address to, uint256 tokenId) external {
        ERC721Storage.layout().mint(_msgSender(), to, tokenId, "", false);
    }

    function batchMint(address to, uint256[] calldata tokenIds) external {
        ERC721Storage.layout().batchMint(to, tokenIds);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external {
        ERC721Storage.layout().mint(_msgSender(), to, tokenId, data, true);
    }

}