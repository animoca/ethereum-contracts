// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Mintable} from "./interfaces/IERC20Mintable.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20MintableBase} from "./ERC20MintableBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Mintable (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20Mintable is ERC20MintableBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Mintable.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Mintable).interfaceId, true);
    }
}
