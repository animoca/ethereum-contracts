// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Thrown when trying to transfer tokens without calldata to the contract.
error EtherReceptionDisabled();

/// @notice Thrown when the multiple related arrays have different lengths.
error InconsistentArrayLengths();

/// @notice Thrown when an ETH transfer has failed.
error TransferFailed();
