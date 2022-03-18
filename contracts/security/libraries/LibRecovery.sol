// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "./../../token/ERC20/interfaces/IERC20.sol";
import {IERC721} from "./../../token/ERC721/interfaces/IERC721.sol";
import {ERC20Wrapper} from "./../../token/ERC20/libraries/ERC20Wrapper.sol";

library LibRecovery {
    using ERC20Wrapper for IERC20;

    /**
     * Extract ERC20 tokens which were accidentally sent to the contract to a list of accounts.
     * Warning: this function should not be used by contracts which are supposed to hold ERC20 tokens
     * so that the extraction is limited to only amounts sent accidentally.
     * @dev Reverts if `accounts`, `tokens` and `amounts` do not have the same length.
     * @dev Reverts if one of the ERC20 transfers fails for any reason.
     * @param accounts the list of accounts to transfer the tokens to.
     * @param tokens the list of ERC20 token addresses.
     * @param amounts the list of token amounts to transfer.
     */
    function recoverERC20s(
        address[] calldata accounts,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) internal {
        uint256 length = accounts.length;
        require(length == tokens.length && length == amounts.length, "Recovery: inconsistent arrays");
        for (uint256 i = 0; i != length; ++i) {
            IERC20(tokens[i]).wrappedTransfer(accounts[i], amounts[i]);
        }
    }

    /**
     * Extract ERC721 tokens which were accidentally sent to the contract to a list of accounts.
     * Warning: this function should not be used by contracts which are supposed to hold ERC721 tokens
     * so that the extraction is limited to only tokens sent accidentally.
     * @dev Reverts if `accounts`, `contracts` and `amounts` do not have the same length.
     * @dev Reverts if one of the ERC721 transfers fails for any reason.
     * @param accounts the list of accounts to transfer the tokens to.
     * @param contracts the list of ERC721 contract addresses.
     * @param tokenIds the list of token ids to transfer.
     */
    function recoverERC721s(
        address[] calldata accounts,
        address[] calldata contracts,
        uint256[] calldata tokenIds
    ) internal {
        uint256 length = accounts.length;
        require(length == contracts.length && length == tokenIds.length, "Recovery: inconsistent arrays");
        for (uint256 i = 0; i != length; ++i) {
            IERC721(contracts[i]).transferFrom(address(this), accounts[i], tokenIds[i]);
        }
    }
}
