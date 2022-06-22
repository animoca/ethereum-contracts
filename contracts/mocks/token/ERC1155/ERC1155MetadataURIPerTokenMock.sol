// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155MetadataURIPerToken} from "./../../../token/ERC1155/ERC1155MetadataURIPerToken.sol";
import {ERC1155SimpleMock} from "./ERC1155SimpleMock.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC1155TokenMetadataMock
contract ERC1155MetadataPerTokenMock is ERC1155SimpleMock, ERC1155MetadataURIPerToken {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ERC1155SimpleMock
    function _msgSender() internal view virtual override(Context, ERC1155SimpleMock) returns (address) {
        return ERC1155SimpleMock._msgSender();
    }

    /// @inheritdoc ERC1155SimpleMock
    function _msgData() internal view virtual override(Context, ERC1155SimpleMock) returns (bytes calldata) {
        return ERC1155SimpleMock._msgData();
    }
}
