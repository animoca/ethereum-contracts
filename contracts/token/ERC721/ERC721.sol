// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Base} from "./ERC721Base.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721MetadataStorage} from "./libraries/ERC721MetadataStorage.sol";

abstract contract ERC721 is ERC721Base {
    using ERC721Storage for ERC721Storage.Layout;
    using ERC721MetadataStorage for ERC721MetadataStorage.Layout;

    /// @notice Initialized the storage with a list of initial allocations.
    /// @notice Sets the ERc721 storage version to `1`;
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721, ERC721Metadata.
    /// @dev Reverts if the ERC721 storage is already initialized to version `1` or above.
    /// @param name_ the name of the Non-Fungible token.
    /// @param symbol_ the symbol of the Non-Fungible token.
    /// @param tokenUri the tokenUri of the Non-Funble token // TODO remove

    // TODO: move tokenUri to its own storage

    constructor(string memory name_, string memory symbol_, string memory tokenUri) {
        ERC721MetadataStorage.layout().init(name_, symbol_, tokenUri);
        ERC721Storage.layout().init();
    }

}