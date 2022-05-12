// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721MintableOnce} from "./interfaces/IERC721MintableOnce.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

abstract contract ERC721MintableOnceBase is Context, IERC721MintableOnce {
    using AccessControlStorage for AccessControlStorage.Layout;
    using ERC721Storage for ERC721Storage.Layout;

    bytes32 public constant MINTER_ROLE = "minter";

    function mintOnce(address to, uint256 tokenId) external {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().mint(_msgSender(), to, tokenId, "", false);
    }

    function batchMintOnce(address to, uint256[] calldata tokenIds) external {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().batchMint(to, tokenIds);
    }

    function safeMintOnce(
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().mintOnce(_msgSender(), to, tokenId, data, true);
    }
}