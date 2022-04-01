// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Burnable} from "./interfaces/IERC20Burnable.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20BurnableBase} from "./ERC20BurnableBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Burnable (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20Burnable is ERC20BurnableBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Burnable.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Burnable).interfaceId, true);
    }
}
