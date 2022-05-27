// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Receiver} from "./interfaces/IERC721Receiver.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721ReceiverBase} from "./ERC721ReceiverBase.sol";
import {InterfaceDetection} from "./../../introspection/InterfaceDetection.sol";

/// @title ERC721 Non-Fungble Token Standard, Safe Transfers Receiver Contract.
/// @dev The function `onERC721Received(address,address,uint256,bytes)` needs to be implemented by a child contract.
abstract contract ERC721Receiver is ERC721ReceiverBase, InterfaceDetection {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: IERC721Receiver.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Receiver).interfaceId, true);
    }
}
