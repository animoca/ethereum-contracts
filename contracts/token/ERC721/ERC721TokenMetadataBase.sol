// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721TokenMetadataStorage} from "./libraries/ERC721TokenMetadataStorage.sol";
import {ERC721ContractMetadataStorage} from "./libraries/ERC721ContractMetadataStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard (proxiable version), optional extension: Metadata (proxiable version).
/// @dev Extending from this contract enables the child contract owner to set a unique URI for each tokens.
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev `ERC721TokenMetadataStorage.layout().init(name_, symbol_)` should be called during contract initialization.
abstract contract ERC721TokenMetadataBase is Context, IERC721Metadata {
    using ERC721Storage for ERC721Storage.Layout;
    using ERC721ContractMetadataStorage for ERC721ContractMetadataStorage.Layout;
    using ERC721TokenMetadataStorage for ERC721TokenMetadataStorage.Layout;
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    function setTokenURI(uint256 tokenId, string memory uri) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        ERC721TokenMetadataStorage.layout().setTokenURI(tokenId, uri);
    }

    function batchSetTokenURI(uint256[] calldata tokenIds, string[] calldata tokenURIs) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        ERC721TokenMetadataStorage.layout().batchSetTokenURI(tokenIds, tokenURIs);
    }

    /// @inheritdoc IERC721Metadata
    function name() external view override returns (string memory) {
        return ERC721ContractMetadataStorage.layout().name();
    }

    /// @inheritdoc IERC721Metadata
    function symbol() external view override returns (string memory) {
        return ERC721ContractMetadataStorage.layout().symbol();
    }

    /// @inheritdoc IERC721Metadata
    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        ERC721Storage.layout().ownerOf(tokenId); // reverts if the token does not exist
        return ERC721TokenMetadataStorage.layout().tokenURI(tokenId);
    }
}
