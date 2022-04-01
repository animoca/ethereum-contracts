// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AccessControlBase} from "./AccessControlBase.sol";
import {Ownable} from "./Ownable.sol";

/// @title Access control via roles management (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract AccessControl is AccessControlBase, Ownable {

}
