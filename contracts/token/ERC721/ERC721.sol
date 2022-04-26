// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Base} from "./ERC721Base.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import "hardhat/console.sol";

contract ERC721 is ERC721Base {
    using ERC721Storage for ERC721Storage.Layout;

    constructor() {
        console.log("ERC721 constructor");
        ERC721Storage.layout().init();
    }

}