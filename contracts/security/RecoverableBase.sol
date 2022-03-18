// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./../access/libraries/LibOwnership.sol";
import {LibRecovery} from "./libraries/LibRecovery.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Recovery mechanism for ERC20/ERC721 tokens accidentally sent to this contract (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev Note: This contract requires ERC173 (Contract Ownership standard).
 */
contract RecoverableBase is Context {
    /**
     * Extract ERC20 tokens which were accidentally sent to the contract to a list of accounts.
     * Warning: this function should be overriden for contracts which are supposed to hold ERC20 tokens
     * so that the extraction is limited to only amounts sent accidentally.
     * @dev Reverts if the sender is not the contract owner.
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
    ) external virtual {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibRecovery.recoverERC20s(accounts, tokens, amounts);
    }

    /**
     * Extract ERC721 tokens which were accidentally sent to the contract to a list of accounts.
     * Warning: this function should be overriden for contracts which are supposed to hold ERC721 tokens
     * so that the extraction is limited to only tokens sent accidentally.
     * @dev Reverts if the sender is not the contract owner.
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
    ) external virtual {
        LibOwnership.enforceIsContractOwner(_msgSender());
        LibRecovery.recoverERC721s(accounts, contracts, tokenIds);
    }
}
