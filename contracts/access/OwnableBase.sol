// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC173} from "./interfaces/IERC173.sol";
import {OwnershipStorage} from "./libraries/OwnershipStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC173 Contract Ownership Standard (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `OwnershipStorage.init` should be called during contract initialization.
abstract contract OwnableBase is Context, IERC173 {
    using OwnershipStorage for OwnershipStorage.Layout;

    /// @inheritdoc IERC173
    function owner() public view virtual override returns (address) {
        return OwnershipStorage.layout().owner;
    }

    /// @inheritdoc IERC173
    function transferOwnership(address newOwner) public virtual override {
        OwnershipStorage.layout().transferOwnership(_msgSender(), newOwner);
    }
}
