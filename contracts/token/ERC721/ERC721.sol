// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Base} from "./ERC721Base.sol";
import {ERC721TokenMetadataWithBaseURIBase} from "./ERC721TokenMetadataWithBaseURIBase.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";

abstract contract ERC721 is ERC721Base, ERC721TokenMetadataWithBaseURIBase {
    using ERC721Storage for ERC721Storage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;

    /// @notice Initialized the storage with a name, symbol and tokenURI.
    /// @notice Sets the ERC721 storage version to `1`;
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721, ERC721Metadata.
    /// @dev Reverts if the ERC721 storage is already initialized to version `1` or above.
    /// @param name_ the name of the Non-Fungible token.
    /// @param symbol_ the symbol of the Non-Fungible token.
    /// @param tokenUri_ the tokenUri of the Non-Funble token

    constructor(string memory name_, string memory symbol_, string memory tokenUri_) ERC721TokenMetadataWithBaseURIBase (name_, symbol_, tokenUri_) {
        ERC721Storage.layout().init();
    }

}