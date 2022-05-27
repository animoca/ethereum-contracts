// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AccessControlBase} from "./AccessControlBase.sol";
import {ContractOwnership} from "./ContractOwnership.sol";

/// @title Access control via roles management (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract AccessControl is AccessControlBase, ContractOwnership {

}
