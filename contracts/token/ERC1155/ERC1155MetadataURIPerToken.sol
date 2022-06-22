// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC1155Storage} from "./libraries/ERC1155Storage.sol";
import {ERC1155MetadataURIPerTokenBase} from "./base/ERC1155MetadataURIPerTokenBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";

/// @title ERC1155 Multi Token Standard, optional extension: MetadataURIPerToken (immutable version).
/// @notice ERC1155MetadataURI implementation where tokenURIs are set individually per token.
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC1155MetadataURIPerToken is ERC1155MetadataURIPerTokenBase, AccessControl {
    /// @notice Marks the fllowing ERC165 interface(s) as supported: ERC1155MetadataURI
    constructor() {
        ERC1155Storage.initERC1155MetadataURI();
    }
}
