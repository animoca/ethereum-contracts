// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {TokenRecoveryBase} from "./TokenRecoveryBase.sol";
import {ContractOwnership} from "../access/ContractOwnership.sol";

/// @title Recovery mechanism for ERC20/ERC721 tokens accidentally sent to this contract (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract TokenRecovery is TokenRecoveryBase, ContractOwnership {

}
