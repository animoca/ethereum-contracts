// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {InterfaceDetectionStorage} from "./libraries/InterfaceDetectionStorage.sol";
import {ERC165Base} from "./ERC165Base.sol";

/// @title ERC165 Interface Detection Standard (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC165 is ERC165Base {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Initialises the storage.
    /// @notice Sets the interface detection storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC165.
    /// @dev Reverts if the interface detection storage is already initialized to version `1` or above.
    constructor() {
        InterfaceDetectionStorage.layout().init();
    }
}
