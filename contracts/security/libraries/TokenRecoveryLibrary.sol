// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {InconsistentArrayLengths} from "./../../CommonErrors.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC721} from "./../../token/ERC721/interfaces/IERC721.sol";
import {IERC165} from "./../../introspection/interfaces/IERC165.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

library TokenRecoveryLibrary {
    using SafeERC20 for IERC20;
    using Address for address payable;

    /// @notice Thrown when trying to recover a token of the wrong contract type.
    /// @param tokenContract The token contract being recovered.
    error IncorrectTokenContractType(address tokenContract);

    /// @notice Extract ETH tokens which were accidentally sent to the contract to a list of accounts.
    /// @dev Note: While contracts can generally prevent accidental ETH transfer by implementating a reverting
    ///  `receive()` function, this can still be bypassed in a `selfdestruct(address)` scenario.
    /// @dev Warning: this function should be overriden for contracts which are supposed to hold ETH tokens
    ///  so that the extraction is limited to only amounts sent accidentally.
    /// @dev Reverts with {InconsistentArrayLengths} `accounts` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ETH transfers fails for any reason.
    /// @param accounts the list of accounts to transfer the tokens to.
    /// @param amounts the list of token amounts to transfer.
    function recoverETH(address payable[] calldata accounts, uint256[] calldata amounts) internal {
        uint256 length = accounts.length;
        if (length != amounts.length) revert InconsistentArrayLengths();
        for (uint256 i; i < length; ++i) {
            accounts[i].sendValue(amounts[i]);
        }
    }

    /// @notice Extract ERC20 tokens which were accidentally sent to the contract to a list of accounts.
    /// @dev Warning: this function should be overriden for contracts which are supposed to hold ERC20 tokens
    ///  so that the extraction is limited to only amounts sent accidentally.
    /// @dev Reverts with {InconsistentArrayLengths} if `accounts`, `tokens` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC20 transfers fails for any reason.
    /// @param accounts the list of accounts to transfer the tokens to.
    /// @param tokens the list of ERC20 token addresses.
    /// @param amounts the list of token amounts to transfer.
    function recoverERC20s(address[] calldata accounts, IERC20[] calldata tokens, uint256[] calldata amounts) internal {
        uint256 length = accounts.length;
        if (length != tokens.length || length != amounts.length) revert InconsistentArrayLengths();
        for (uint256 i; i < length; ++i) {
            tokens[i].safeTransfer(accounts[i], amounts[i]);
        }
    }

    /// @notice Extract ERC721 tokens which were accidentally sent to the contract to a list of accounts.
    /// @dev Warning: this function should be overriden for contracts which are supposed to hold ERC721 tokens
    ///  so that the extraction is limited to only tokens sent accidentally.
    /// @dev Reverts with {InconsistentArrayLengths} if `accounts`, `contracts` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC721 transfers fails for any reason.
    /// @param accounts the list of accounts to transfer the tokens to.
    /// @param contracts the list of ERC721 contract addresses.
    /// @param tokenIds the list of token ids to transfer.
    function recoverERC721s(address[] calldata accounts, IERC721[] calldata contracts, uint256[] calldata tokenIds) internal {
        uint256 length = accounts.length;
        if (length != contracts.length || length != tokenIds.length) revert InconsistentArrayLengths();
        for (uint256 i; i < length; ++i) {
            IERC721 tokenContract = contracts[i];
            if (!IERC165(address(tokenContract)).supportsInterface(type(IERC721).interfaceId)) {
                revert IncorrectTokenContractType(address(tokenContract));
            }
            contracts[i].safeTransferFrom(address(this), accounts[i], tokenIds[i]);
        }
    }
}
