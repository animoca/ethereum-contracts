// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
import {UInt256ToDecimalString} from "./../../utils/types/UInt256ToDecimalString.sol";

abstract contract ERC721TokenMetadataWithBaseURIBase is Context, IERC721Metadata {
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;
    using UInt256ToDecimalString for uint256;

    constructor(string memory name_, string memory symbol_, string memory tokenURI_){
        ERC721ContractMetadataStorage.layout().init(name_, symbol_);
        ERC721TokenMetadataWithBaseURIStorage.layout().init(tokenURI_);
    }

    function name() external view returns (string memory) {
        return ERC721ContractMetadataStorage.layout().name;
    }

    function symbol() external view returns (string memory) {
        return  ERC721ContractMetadataStorage.layout().symbol;
    }

    //TODO: tokenURI implementation should be injectable.

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(ERC721TokenMetadataWithBaseURIStorage.layout().tokenURI, tokenId.toDecimalString()));
    }
}