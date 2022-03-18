// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./libraries/LibOwnership.sol";
import {IERC173} from "./interfaces/IERC173.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ERC173 Contract Ownership Standard (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibOwnership.initOwnershipStorage(owner_)` should be called during contract initialisation.
 */
abstract contract OwnableBase is Context, IERC173 {
    /// @inheritdoc IERC173
    function owner() public view virtual override returns (address) {
        return LibOwnership.owner();
    }

    /// @inheritdoc IERC173
    function transferOwnership(address newOwner) public virtual override {
        LibOwnership.transferOwnership(newOwner, _msgSender());
    }
}
