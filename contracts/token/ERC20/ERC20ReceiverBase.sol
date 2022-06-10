// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Receiver} from "./interfaces/IERC20Receiver.sol";

/// @title ERC20 Fungible Token Standard, Receiver (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
abstract contract ERC20ReceiverBase is IERC20Receiver {

}
