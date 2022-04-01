// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20SafeTransfers} from "./interfaces/IERC20SafeTransfers.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20SafeTransfersBase} from "./ERC20SafeTransfersBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Safe Transfers (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20SafeTransfers is ERC20SafeTransfersBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20SafeTransfers.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20SafeTransfers).interfaceId, true);
    }
}
