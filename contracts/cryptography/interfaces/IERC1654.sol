// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @title Dapp-wallet authentication process with contract wallets support.
/// @dev See https://eips.ethereum.org/EIPS/eip-1271
/// @dev This interface is used in the final version of ERC1271.
interface IERC1654 {
    /// Returns whether the signature is valid for the data hash.
    /// @param hash The hash of the signed data.
    /// @param signature The signature for `hash`.
    /// @return magicValue `0x1626ba7e` if the signature is valid, else any other value.
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
}
