// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Events} from "./interfaces/IERC721Events.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `ERC721Storage.init` should be called during contract initialization.
abstract contract ERC721Base is Context, IERC721, IERC721Events {
    using ERC721Storage for ERC721Storage.Layout;

    /// @inheritdoc IERC721
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: zero address");
        return ERC721Storage.layout().nftBalances[owner];
    }

    /// @inheritdoc IERC721
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = address(uint160(ERC721Storage.layout().owners[tokenId]));
        require(owner != address(0), "ERC721: non-existing NFT");
        return owner;
    }

    /// @inheritdoc IERC721
    function approve(address to, uint256 tokenId) public virtual override {
        ERC721Storage.layout().approve(_msgSender(), to, tokenId);
    }

    /// @inheritdoc IERC721
    function setApprovalForAll(address operator, bool _approved) public virtual override {
        ERC721Storage.layout().setApprovalForAll(_msgSender(), operator, _approved);
    }

    /// @inheritdoc IERC721
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        ERC721Storage.layout().transferFrom(_msgSender(), from, to, tokenId);
    }

    /// @inheritdoc IERC721
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        ERC721Storage.layout().safeTransferFrom(_msgSender(), from, to, tokenId, _data);
    }

    /// @inheritdoc IERC721
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        ERC721Storage.layout().safeTransferFrom(_msgSender(), from, to, tokenId);
    }

    /// @inheritdoc IERC721
    function getApproved(uint256 tokenId) external view returns (address operator) {
        return ERC721Storage.layout().getApproved(tokenId);
    }

    /// @inheritdoc IERC721
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return ERC721Storage.layout().operators[owner][operator];
    }
}
