// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721TokenMetadataWithBaseURIBase} from "./ERC721TokenMetadataWithBaseURIBase.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";


abstract contract ERC721TokenMetadataWithBaseURI is ERC721TokenMetadataWithBaseURIBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;
    
    constructor(string memory name_, string memory symbol_, string memory tokenURI_){
        ERC721TokenMetadataWithBaseURIStorage.layout().init(name_, symbol_, tokenURI_);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Metadata).interfaceId, true);
    }
}