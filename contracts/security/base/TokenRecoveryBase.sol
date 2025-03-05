// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC721} from "./../../token/ERC721/interfaces/IERC721.sol";
import {ITokenRecovery} from "./../interfaces/ITokenRecovery.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {TokenRecoveryLibrary} from "./../libraries/TokenRecoveryLibrary.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Recovery mechanism for ETH/ERC20/ERC721 tokens accidentally sent to this contract (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC173 (Contract Ownership standard).
abstract contract TokenRecoveryBase is ITokenRecovery, Context {
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    /// @inheritdoc ITokenRecovery
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {InconsistentArrayLengths} `accounts` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ETH transfers fails for any reason.
    function recoverETH(address payable[] calldata accounts, uint256[] calldata amounts) public virtual {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        TokenRecoveryLibrary.recoverETH(accounts, amounts);
    }

    /// @inheritdoc ITokenRecovery
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {InconsistentArrayLengths} if `accounts`, `tokens` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC20 transfers fails for any reason.
    function recoverERC20s(address[] calldata accounts, IERC20[] calldata tokens, uint256[] calldata amounts) public virtual {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        TokenRecoveryLibrary.recoverERC20s(accounts, tokens, amounts);
    }

    /// @inheritdoc ITokenRecovery
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Reverts with {InconsistentArrayLengths} if `accounts`, `contracts` and `amounts` do not have the same length.
    /// @dev Reverts if one of the ERC721 transfers fails for any reason.
    function recoverERC721s(address[] calldata accounts, IERC721[] calldata contracts, uint256[] calldata tokenIds) public virtual {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        TokenRecoveryLibrary.recoverERC721s(accounts, contracts, tokenIds);
    }
}
