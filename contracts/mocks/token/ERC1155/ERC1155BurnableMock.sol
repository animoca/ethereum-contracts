// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155Mock} from "./ERC1155Mock.sol";
import {ERC1155Burnable} from "./../../../token/ERC1155/ERC1155Burnable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC1155BurnableMock
contract ERC1155BurnableMock is ERC1155Mock, ERC1155Burnable {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155Mock(forwarderRegistry) {}

    /// @inheritdoc ERC1155Mock
    function _msgSender() internal view virtual override(Context, ERC1155Mock) returns (address) {
        return ERC1155Mock._msgSender();
    }

    /// @inheritdoc ERC1155Mock
    function _msgData() internal view virtual override(Context, ERC1155Mock) returns (bytes calldata) {
        return ERC1155Mock._msgData();
    }
}
