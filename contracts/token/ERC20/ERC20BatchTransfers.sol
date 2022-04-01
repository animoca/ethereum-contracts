// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20BatchTransfers} from "./interfaces/IERC20BatchTransfers.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20BatchTransfersBase} from "./ERC20BatchTransfersBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Batch Transfers (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20BatchTransfers is ERC20BatchTransfersBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20BatchTransfers.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20BatchTransfers).interfaceId, true);
    }
}
