// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721Mintable} from "./interfaces/IERC721Mintable.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721MintableBase} from "./ERC721MintableBase.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Mintable (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
abstract contract ERC721Mintable is ERC721MintableBase, AccessControl {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Mintable.
    constructor() ContractOwnership(msg.sender) {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Mintable).interfaceId, true);
    }
}
