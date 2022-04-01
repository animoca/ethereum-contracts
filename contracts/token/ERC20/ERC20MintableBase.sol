// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Mintable} from "./interfaces/IERC20Mintable.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {ERC20Storage} from "./libraries/ERC20Storage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Mintable (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `InterfaceDetectionStorage.setSupportedInterface` for ERC20Mintable interface should be called during contract initialization.
/// @dev Note: This contract requires AccessControl.
abstract contract ERC20MintableBase is Context, IERC20Mintable {
    using AccessControlStorage for AccessControlStorage.Layout;
    using ERC20Storage for ERC20Storage.Layout;

    bytes32 public constant MINTER_ROLE = "minter";

    /// @inheritdoc IERC20Mintable
    /// @dev Reverts if the sender does not have the minter role.
    function mint(address to, uint256 value) external virtual override {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC20Storage.layout().mint(to, value);
    }

    /// @inheritdoc IERC20Mintable
    /// @dev Reverts if the sender does not have the minter role.
    function batchMint(address[] memory recipients, uint256[] memory values) external virtual override {
        AccessControlStorage.layout().enforceHasRole(MINTER_ROLE, _msgSender());
        ERC20Storage.layout().batchMint(recipients, values);
    }
}
