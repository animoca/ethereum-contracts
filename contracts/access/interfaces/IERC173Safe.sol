// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ERC-173 Contract Ownership Standard with safe ownership transfer (functions)
/// @dev See https://eips.ethereum.org/EIPS/eip-173
/// @dev Note: the ERC-165 identifier for this interface is 0x7f5828d0
interface IERC173Safe {
    /// @notice Sets an address as the pending new contract owner.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Emits an {OwnershipTransferred} event if `newOwner` is the zero address.
    /// @dev Emits an {OwnershipTransferPending} event if `newOwner` not the zero address and not the current contract owner.
    /// @param newOwner The address of the new contract owner. Using the zero address means renouncing ownership.
    function transferOwnership(address newOwner) external;

    /// @notice Sets the pending contract owner as the new contract owner.
    /// @dev Reverts if the sender is not the pending contract owner.
    /// @dev Emits an {OwnershipTransferred} event.
    function acceptOwnership() external;

    /// @notice Gets the address of the contract owner.
    /// @return contractOwner The address of the contract owner.
    function owner() external view returns (address contractOwner);

    /// @notice Gets the address of the pending contract owner.
    /// @return pendingContractOwner The address of the pending contract owner.
    function pendingOwner() external view returns (address pendingContractOwner);
}
