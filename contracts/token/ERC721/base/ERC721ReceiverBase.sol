// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Receiver} from "./../interfaces/IERC721Receiver.sol";

/// @title ERC721 Non-Fungible Token Standard, Receiver (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
abstract contract ERC721ReceiverBase is IERC721Receiver {

}
