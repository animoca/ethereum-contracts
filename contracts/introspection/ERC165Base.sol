// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC165} from "./interfaces/IERC165.sol";
import {LibInterfaceDetection} from "./libraries/LibInterfaceDetection.sol";

/**
 * @title ERC165 Interface Detection Standard (proxiable version).
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibInterfaceDetection.initInterfaceDetectionStorage()` should be called during contract initialisation.
 */
abstract contract ERC165Base is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return LibInterfaceDetection.supportsInterface(interfaceId);
    }
}
