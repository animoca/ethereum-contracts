// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {IERC721Mintable} from "./interfaces/IERC721Mintable.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Mintable (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation
abstract contract ERC721MintableBase is Context, IERC721Mintable {
    using AccessControlStorage for AccessControlStorage.Layout;
    using ERC721Storage for ERC721Storage.Layout;

    bytes32 public constant MINTER_ROLE = "minter";

    /// @inheritdoc IERC721Mintable
    function mint(address to, uint256 tokenId) external virtual override {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().mint(_msgSender(), to, tokenId, "", false);
    }

    /// @inheritdoc IERC721Mintable
    function batchMint(address to, uint256[] calldata tokenIds) external virtual override {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().batchMint(to, tokenIds);
    }

    /// @inheritdoc IERC721Mintable
    function safeMint(
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external virtual override {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().mint(_msgSender(), to, tokenId, data, true);
    }
}
