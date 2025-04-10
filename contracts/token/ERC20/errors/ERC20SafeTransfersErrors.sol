// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Thrown when a safe transfer is rejected by the recipient contract.
/// @param recipient The recipient contract.
error ERC20SafeTransferRejected(address recipient);
