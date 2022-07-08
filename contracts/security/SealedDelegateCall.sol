// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {SealedDelegateCallBase} from "./base/SealedDelegateCallBase.sol";
import {AccessControl} from "./../access/AccessControl.sol";

/// @title Sealead executions via delegatecalls on this contract (proxiable version).
/// @notice Enables calls to this contract to be performed uniquely thanks to a seal identifier.
/// @notice Multiple executions can happen for example due to automation bugs in a backend or in a script.
/// @notice Typically, it can be a good practice to protect the minting of fungible tokens with an immutable seal identifier,
/// @notice such as a constant defined in a script or in a unique database field.
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract SealedDelegateCall is SealedDelegateCallBase, AccessControl {

}
