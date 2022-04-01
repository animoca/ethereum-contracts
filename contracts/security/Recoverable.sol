// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {RecoverableBase} from "./RecoverableBase.sol";
import {Ownable} from "../access/Ownable.sol";

/// @title Recovery mechanism for ERC20/ERC721 tokens accidentally sent to this contract (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract Recoverable is RecoverableBase, Ownable {

}
