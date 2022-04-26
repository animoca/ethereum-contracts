// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Base} from "./ERC721Base.sol";
//import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
//import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
//import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
//import {ERC721TokenMetadataWithBaseURIBase} from "./ERC721TokenMetadataWithBaseURIBase.sol";

contract ERC721 is ERC721Base {
    using ERC721Storage for ERC721Storage.Layout;
    //using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    //using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;

    constructor() {
        ERC721Storage.layout().init();
    }

}