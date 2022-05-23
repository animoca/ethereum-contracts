// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721BatchTransferBase} from "./ERC721BatchTransferBase.sol";
import {IERC721BatchTransfer} from "./interfaces/IERC721BatchTransfer.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";

/// @title ERC721 Non-Fungible Token Standard: optional extension: BatchTransfer (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721BatchTransfer is ERC721BatchTransferBase {
     using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interfaces(s) as supported: ERC721BatchTransfer
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721BatchTransfer).interfaceId, true);
    }
}