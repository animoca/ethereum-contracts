// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Base} from "./ERC721Base.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";

abstract contract ERC721 is ERC721Base {
    using ERC721Storage for ERC721Storage.Layout;

    constructor(){
        ERC721Storage.layout().init();
    }

}