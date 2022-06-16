// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721Mock} from "./ERC721Mock.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721BurnableMock
contract ERC721BurnableMock is ERC721Mock, ERC721Burnable {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC721Mock(name_, symbol_, tokenURI_, forwarderRegistry) {}

    /// @inheritdoc ERC721Mock
    function _msgSender() internal view virtual override(Context, ERC721Mock) returns (address) {
        return ERC721Mock._msgSender();
    }

    /// @inheritdoc ERC721Mock
    function _msgData() internal view virtual override(Context, ERC721Mock) returns (bytes calldata) {
        return ERC721Mock._msgData();
    }
}
