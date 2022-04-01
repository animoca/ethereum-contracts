// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Permit} from "./interfaces/IERC20Permit.sol";
import {ERC20PermitStorage} from "./libraries/ERC20PermitStorage.sol";
import {ERC20PermitBase} from "./ERC20PermitBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Permit (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC20Permit is ERC20PermitBase {
    /// @notice Initialises the storage.
    /// @notice Sets the ERC20Permit storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Permit.
    /// @dev Reverts if the ERC20Permit storage is already initialized to version `1` or above.
    constructor() {
        ERC20PermitStorage.init();
    }
}
