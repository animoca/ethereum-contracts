// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Receiver} from "./interfaces/IERC20Receiver.sol";

/// @title ERC20 Fungible Token Standard, Receiver (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `InterfaceDetectionStorage.setSupportedInterface` for ERC20Receiver interface should be called during contract initialization.
abstract contract ERC20ReceiverBase is IERC20Receiver {
    // `bytes4(keccak256("onERC20Received(address,address,uint256,bytes)"))`
    bytes4 internal constant _ERC20_RECEIVED = 0x4fc35859;
}