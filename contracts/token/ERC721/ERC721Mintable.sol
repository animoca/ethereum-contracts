// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721MintableOnce} from "./interfaces/IERC721MintableOnce.sol";
import {ERC721MintableBase} from "./ERC721MintableBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {Ownable} from "./../../access/Ownable.sol";

abstract contract ERC721Mintable is ERC721MintableBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20MintableOnce.
    constructor() Ownable (msg.sender) {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721MintableOnce).interfaceId, true);
    }
}