// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/**
 * @title ERC721 Non-Fungible Token Standard, basic interface (events).
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * @dev This interface only contains the standard events, see IERC721 for the functions.
 * @dev Note: The ERC-165 identifier for this interface is 0x80ac58cd.
 */
interface IERC721Events {
    /// @notice Emitted when a token is transferred.
    /// @param from The previous owner of the token.
    /// @param to The new owner of the token
    /// @param tokenId ID of the token transferred.
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /// @notice Emitted when a single token approval is set.
    /// @param owner The token owner.
    /// @param approved The approved address.
    /// @param tokenId ID of the token approved.
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /// @notice Emitted when a full approval is set or unset.
    /// @param owner The tokens owner.
    /// @param operator The approved address.
    /// @param approved True when then approval is set, false when it is unset.
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}
