// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
import {UInt256ToDecimalString} from "./../../utils/types/UInt256ToDecimalString.sol";

/// @title ERC721 Non-Fungible Token Standard (proxiable version), optional extension: Metadata (proxiable version).
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `ERC721TokenMetadataWithBaseURIStorage.layout().init(name_, symbol_, tokenURI_)` should be called during contract initialization.

abstract contract ERC721TokenMetadataWithBaseURIBase is Context, IERC721Metadata {
    using ERC721Storage for ERC721Storage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;
    using UInt256ToDecimalString for uint256;

    /// @inheritdoc IERC721Metadata
    function name() external view override returns (string memory) {
        return ERC721ContractMetadataStorage.layout().contractName();
    }

    /// @inheritdoc IERC721Metadata
    function symbol() external view override returns (string memory) {
        return ERC721ContractMetadataStorage.layout().contractSymbol();
    }

    /// @inheritdoc IERC721Metadata
    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(address(uint160(ERC721Storage.layout().owners[tokenId])) != address(0), "ERC721: non-existing NFT");
        return string(abi.encodePacked(ERC721TokenMetadataWithBaseURIStorage.layout().contractTokenURI(), tokenId.toDecimalString()));
    }
}
