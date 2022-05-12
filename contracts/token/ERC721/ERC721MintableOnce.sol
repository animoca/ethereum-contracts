// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721MintableOnceBase} from "./ERC721MintableOnceBase.sol";
import {IERC721MintableOnce} from "./interfaces/IERC721MintableOnce.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";


abstract contract ERC721MintableOnce is ERC721MintableOnceBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    constructor(
    ){
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721MintableOnce).interfaceId, true);
    }
}