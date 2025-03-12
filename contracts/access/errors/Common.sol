// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Thrown when the target contract is actually not a contract.
/// @param targetContract The contract that was checked
error TargetIsNotAContract(address targetContract);
