// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Burnable} from "./interfaces/IERC721Burnable.sol";
import {ERC721BurnableBase} from "./ERC721BurnableBase.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";

abstract contract ERC721Burnable is ERC721BurnableBase {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    
    constructor() {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Burnable).interfaceId, true);
    }
}