// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/**
 * @title Animoca Brands' custom ERC721 extension: MintableOnce.
 */
interface IERC721MintableOnce {
    /**
     * Unsafely mints a token once. Can't be minted again after burn.
     * @dev Reverts if `to` is the zero address.
     * @dev Reverts if `tokenId` has already been minted.
     * @dev Emits an {IERC721-Transfer} event from the zero address.
     * @param to Address of the new token owner.
     * @param tokenId Identifier of the token to mint.
     */
    function mintOnce(address to, uint256 tokenId) external;

    /**
     * Unsafely mints a batch of tokens once. Can't be minted again after burn,
     * @dev Reverts if `to` is the zero address.
     * @dev Reverts if one of `tokenIds` has already been minted.
     * @dev Emits an {IERC721-Transfer} event from the zero address for each of `tokenIds`.
     * @param to Address of the new tokens owner.
     * @param tokenIds Identifiers of the tokens to mint.
     */
    function batchMintOnce(address to, uint256[] calldata tokenIds) external;

    /**
     * Safely mints a token once. Can't be minted again after burn.
     * @dev Reverts if `to` is the zero address.
     * @dev Reverts if `tokenId` has already ben minted.
     * @dev Reverts if `to` is a contract and the call to {IERC721Receiver-onERC721Received} fails or is refused.
     * @dev Emits an {IERC721-Transfer} event from the zero address.
     * @param to Address of the new token owner.
     * @param tokenId Identifier of the token to mint.
     * @param data Optional data to pass along to the receiver call.
     */
    function safeMintOnce(
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;
}
