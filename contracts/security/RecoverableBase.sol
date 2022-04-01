// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20} from "./../token/ERC20/interfaces/IERC20.sol";
import {IERC721} from "./../token/ERC721/interfaces/IERC721.sol";
import {OwnershipStorage} from "./../access/libraries/OwnershipStorage.sol";
import {ERC20Wrapper} from "./../token/ERC20/libraries/ERC20Wrapper.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Recovery mechanism for ERC20/ERC721 tokens accidentally sent to this contract (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC173 (Contract Ownership standard).
contract RecoverableBase is Context {
    using OwnershipStorage for OwnershipStorage.Layout;
    using ERC20Wrapper for IERC20;

    /// @notice Extract ERC20 tokens which were accidentally sent to the contract to a list of accounts.
    /// @dev Warning: this function should be overriden for contracts which are supposed to hold ERC20 tokens
    ///  so that the extraction is limited to only amounts sent accidentally.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Reverts if `accounts`, `tokens` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC20 transfers fails for any reason.
    /// @param accounts the list of accounts to transfer the tokens to.
    /// @param tokens the list of ERC20 token addresses.
    /// @param amounts the list of token amounts to transfer.
    function recoverERC20s(
        address[] calldata accounts,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external virtual {
        OwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        uint256 length = accounts.length;
        require(length == tokens.length && length == amounts.length, "Recovery: inconsistent arrays");
        for (uint256 i = 0; i != length; ++i) {
            IERC20(tokens[i]).wrappedTransfer(accounts[i], amounts[i]);
        }
    }

    /// @notice Extract ERC721 tokens which were accidentally sent to the contract to a list of accounts.
    /// @dev Warning: this function should be overriden for contracts which are supposed to hold ERC721 tokens
    ///  so that the extraction is limited to only tokens sent accidentally.
    /// @dev Reverts if the sender is not the contract owner.
    /// @dev Reverts if `accounts`, `contracts` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC721 transfers fails for any reason.
    /// @param accounts the list of accounts to transfer the tokens to.
    /// @param contracts the list of ERC721 contract addresses.
    /// @param tokenIds the list of token ids to transfer.
    function recoverERC721s(
        address[] calldata accounts,
        address[] calldata contracts,
        uint256[] calldata tokenIds
    ) external virtual {
        OwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        uint256 length = accounts.length;
        require(length == contracts.length && length == tokenIds.length, "Recovery: inconsistent arrays");
        for (uint256 i = 0; i != length; ++i) {
            IERC721(contracts[i]).transferFrom(address(this), accounts[i], tokenIds[i]);
        }
    }
}
