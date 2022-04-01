// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC165} from "./interfaces/IERC165.sol";
import {InterfaceDetectionStorage} from "./libraries/InterfaceDetectionStorage.sol";

/// @title ERC165 Interface Detection Standard (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `InterfaceDetectionStorage.init` should be called during contract initialization.
abstract contract ERC165Base is IERC165 {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return InterfaceDetectionStorage.layout().supportsInterface(interfaceId);
    }
}
