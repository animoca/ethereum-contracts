// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155SimpleMock} from "./ERC1155SimpleMock.sol";
import {ERC1155Deliverable} from "./../../../token/ERC1155/ERC1155Deliverable.sol";
import {ERC1155MetadataURIWithBaseURI} from "./../../../token/ERC1155/ERC1155MetadataURIWithBaseURI.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC1155Mock
contract ERC1155Mock is ERC1155SimpleMock, ERC1155Deliverable, ERC1155MetadataURIWithBaseURI {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155MetadataURIWithBaseURI() ERC1155SimpleMock(forwarderRegistry) {}

    /// @inheritdoc ERC1155SimpleMock
    function _msgSender() internal view virtual override(Context, ERC1155SimpleMock) returns (address) {
        return ERC1155SimpleMock._msgSender();
    }

    /// @inheritdoc ERC1155SimpleMock
    function _msgData() internal view virtual override(Context, ERC1155SimpleMock) returns (bytes calldata) {
        return ERC1155SimpleMock._msgData();
    }
}
