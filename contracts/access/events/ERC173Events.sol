// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @notice Emitted when the contract ownership changes.
/// @param previousOwner the previous contract owner.
/// @param newOwner the new contract owner.
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

/// @notice Emitted when a new contract owner is pending.
/// @param pendingOwner the address of the new contract owner.
event OwnershipTransferPending(address indexed pendingOwner);
