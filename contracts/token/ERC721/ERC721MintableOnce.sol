// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721MintableOnceBase} from "./ERC721MintableOnceBase.sol";
import {IERC721Mintable} from "./interfaces/IERC721Mintable.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";

/// @title ERC721 Non-Fungible Token Standard, custom extension: MintableOnce (immutable version)
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation
abstract contract ERC721MintableOnce is ERC721MintableOnceBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: IERC721MintableOnce.
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Mintable).interfaceId, true);
    }
}
