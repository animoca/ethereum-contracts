// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {SealedCallBase} from "./base/SealedCallBase.sol";
import {AccessControl} from "./../access/AccessControl.sol";

/// @title Sealead executions via calls on target contracts (immutable version).
/// @notice Enables contract calls to be performed uniquely thanks to a seal identifier.
/// @notice Multiple executions can happen for example due to automation bugs in a backend or in a script.
/// @notice Typically, it can be a good practice to protect the minting of fungible tokens with an immutable seal identifier,
/// @notice such as a constant defined in a script or in a unique database field.
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract SealedCall is SealedCallBase, AccessControl {

}
