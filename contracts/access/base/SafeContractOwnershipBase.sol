// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC173Safe} from "./../interfaces/IERC173Safe.sol";
import {SafeContractOwnershipStorage} from "./../libraries/SafeContractOwnershipStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC173 Contract Ownership Standard with safe ownership transfer (proxiable version).
/// @dev See https://eips.ethereum.org/EIPS/eip-173
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires ERC165 (Interface Detection Standard).
abstract contract SafeContractOwnershipBase is IERC173Safe, Context {
    using SafeContractOwnershipStorage for SafeContractOwnershipStorage.Layout;

    /// @inheritdoc IERC173Safe
    function transferOwnership(address newOwner) public virtual {
        SafeContractOwnershipStorage.layout().transferOwnership(_msgSender(), newOwner);
    }

    /// @inheritdoc IERC173Safe
    function acceptOwnership() public virtual {
        SafeContractOwnershipStorage.layout().acceptOwnership(_msgSender());
    }

    /// @inheritdoc IERC173Safe
    function owner() public view virtual returns (address) {
        return SafeContractOwnershipStorage.layout().owner();
    }

    /// @inheritdoc IERC173Safe
    function pendingOwner() public view virtual returns (address) {
        return SafeContractOwnershipStorage.layout().pendingOwner();
    }
}
