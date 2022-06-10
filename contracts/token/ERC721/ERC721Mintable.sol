// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721MintableBase} from "./ERC721MintableBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Mintable (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721Mintable is ERC721MintableBase, AccessControl {
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Mintable.
    constructor() ContractOwnership(msg.sender) {
        ERC721Storage.initERC721Mintable();
    }
}
