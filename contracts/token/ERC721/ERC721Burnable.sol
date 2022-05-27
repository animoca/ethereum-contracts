// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {IERC721Burnable} from "./interfaces/IERC721Burnable.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721BurnableBase} from "./ERC721BurnableBase.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Burnable (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721Burnable is ERC721BurnableBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the fllowing ERC165 interface(s) as supported: ERC721Burnable
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Burnable).interfaceId, true);
    }
}
