// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155Storage} from "../../../../token/ERC1155/libraries/ERC1155Storage.sol";
import {ERC1155SimpleProxiedMock} from "./ERC1155SimpleProxiedMock.sol";
import {ERC1155MetadataURIPerTokenBase} from "./../../../../token/ERC1155/base/ERC1155MetadataURIPerTokenBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ERC1155MetadataURIPerTokenProxiedMock is ERC1155SimpleProxiedMock, ERC1155MetadataURIPerTokenBase {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155SimpleProxiedMock(forwarderRegistry) {}

    function init() public virtual override {
        super.init();
        ERC1155Storage.initERC1155MetadataURI();
    }

    /// @inheritdoc ERC1155SimpleProxiedMock
    function _msgSender() internal view virtual override(Context, ERC1155SimpleProxiedMock) returns (address) {
        return ERC1155SimpleProxiedMock._msgSender();
    }

    /// @inheritdoc ERC1155SimpleProxiedMock
    function _msgData() internal view virtual override(Context, ERC1155SimpleProxiedMock) returns (bytes calldata) {
        return ERC1155SimpleProxiedMock._msgData();
    }
}
