// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {Ownable} from "./../../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";

contract ERC721SimpleMock is ERC721, ERC721Mintable, ERC721TokenMetadataWithBaseURI, ForwarderRegistryContextBase {
   constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_) ForwarderRegistryContextBase(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}