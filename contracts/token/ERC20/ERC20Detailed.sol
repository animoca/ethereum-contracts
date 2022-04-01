// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC20DetailedStorage} from "./libraries/ERC20DetailedStorage.sol";
import {ERC20DetailedBase} from "./ERC20DetailedBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Detailed (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20Detailed is ERC20DetailedBase {
    using ERC20DetailedStorage for ERC20DetailedStorage.Layout;

    /// @notice Initialises the storage with the token details.
    /// @notice Sets the ERC20Detailed storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Detailed.
    /// @dev Reverts if the ERC20Detailed storage is already initialized to version `1` or above.
    /// @param name_ The token name.
    /// @param symbol_ The token symbol.
    /// @param decimals_ The token decimals.
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) {
        ERC20DetailedStorage.layout().init(name_, symbol_, decimals_);
    }
}
