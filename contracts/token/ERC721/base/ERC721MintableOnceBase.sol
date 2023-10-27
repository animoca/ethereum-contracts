// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721Mintable} from "./../interfaces/IERC721Mintable.sol";
import {ERC721Storage} from "./../libraries/ERC721Storage.sol";
import {AccessControlStorage} from "./../../../access/libraries/AccessControlStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Mintable (proxiable version)
/// @notice ERC721Mintable implementation where burnt tokens cannot be minted again.
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC721 (Non-Fungible Token Standard).
/// @dev Note: This contract requires AccessControl.
abstract contract ERC721MintableOnceBase is IERC721Mintable, Context {
    using ERC721Storage for ERC721Storage.Layout;
    using AccessControlStorage for AccessControlStorage.Layout;

    bytes32 public constant MINTER_ROLE = "minter";

    /// @inheritdoc IERC721Mintable
    /// @dev Reverts with {NotRoleHolder} if the sender does not have the 'minter' role.
    /// @dev Reverts with {ERC721BurntToken} if `tokenId` has been previously burnt.
    function mint(address to, uint256 tokenId) external virtual {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().mintOnce(to, tokenId);
    }

    /// @inheritdoc IERC721Mintable
    /// @dev Reverts with {NotRoleHolder} if the sender does not have the 'minter' role.
    /// @dev Reverts with {ERC721BurntToken} if `tokenId` has been previously burnt.
    function safeMint(address to, uint256 tokenId, bytes calldata data) external virtual {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().safeMintOnce(_msgSender(), to, tokenId, data);
    }

    /// @inheritdoc IERC721Mintable
    /// @dev Reverts with {NotRoleHolder} if the sender does not have the 'minter' role.
    /// @dev Reverts with {ERC721BurntToken} if one of `tokenIds` has been previously burnt.
    function batchMint(address to, uint256[] calldata tokenIds) external virtual {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC721Storage.layout().batchMintOnce(to, tokenIds);
    }

    /// @notice Gets whether a token was burnt.
    /// @param tokenId The token identifier.
    /// @return tokenWasBurnt Whether the token was burnt.
    function wasBurnt(uint256 tokenId) external view virtual returns (bool tokenWasBurnt) {
        return ERC721Storage.layout().wasBurnt(tokenId);
    }
}
