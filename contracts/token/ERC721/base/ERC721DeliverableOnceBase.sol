// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721Deliverable} from "./../interfaces/IERC721Deliverable.sol";
import {ERC721Storage} from "./../libraries/ERC721Storage.sol";
import {AccessControlStorage} from "./../../../access/libraries/AccessControlStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Deliverable (proxiable version)
/// @notice ERC721Deliverable implementation where burnt tokens cannot be minted again.
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC721 (Non-Fungible Token Standard).
/// @dev Note: This contract requires AccessControl.
abstract contract ERC721DeliverableOnceBase is IERC721Deliverable, Context {
    using ERC721Storage for ERC721Storage.Layout;
    using AccessControlStorage for AccessControlStorage.Layout;

    // prevent variable name clash with public ERC721MintableOnceBase.MINTER_ROLE
    bytes32 private constant _MINTER_ROLE = "minter";

    /// @inheritdoc IERC721Deliverable
    /// @dev Reverts with {NotRoleHolder} if the sender does not have the 'minter' role.
    /// @dev Reverts with {ERC721BurntToken} if one of `tokenIds` has been previously burnt.
    function deliver(address[] calldata recipients, uint256[] calldata tokenIds) external virtual {
        AccessControlStorage.layout().enforceHasRole(_MINTER_ROLE, _msgSender());
        ERC721Storage.layout().deliverOnce(recipients, tokenIds);
    }
}
