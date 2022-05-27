// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721MintableOnce} from "./../../../token/ERC721/ERC721MintableOnce.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {Ownable} from "./../../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC721MintableOnceFacetMock
contract ERC721MintableOnceMock is ERC721, ERC721MintableOnce, ERC721Burnable, ERC721TokenMetadataWithBaseURI, ForwarderRegistryContextBase {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_) ForwarderRegistryContextBase(forwarderRegistry) Ownable(msg.sender) {}

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}
