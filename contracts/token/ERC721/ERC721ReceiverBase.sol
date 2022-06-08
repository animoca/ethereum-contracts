// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Receiver} from "./interfaces/IERC721Receiver.sol";

/// @title ERC721 Non-Fungible Token Standard, Receiver (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `InterfaceDetectionStorage.setSupportedInterface` for ERC721Receiver interface should be called during contract initialization.
abstract contract ERC721ReceiverBase is IERC721Receiver {
    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))``
    bytes4 internal constant _ERC721_RECEIVED = type(IERC721Receiver).interfaceId;
}
