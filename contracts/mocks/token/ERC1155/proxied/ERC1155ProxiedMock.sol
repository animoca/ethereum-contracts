// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IForwarderRegistry} from "../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155Storage} from "../../../../token/ERC1155/libraries/ERC1155Storage.sol";
import {TokenMetadataWithBaseURIStorage} from "../../../../token/metadata/libraries/TokenMetadataWithBaseURIStorage.sol";
import {ERC1155SimpleProxiedMock} from "./ERC1155SimpleProxiedMock.sol";
import {ERC1155DeliverableBase} from "./../../../../token/ERC1155/base/ERC1155DeliverableBase.sol";
import {ERC1155MetadataURIWithBaseURIBase} from "./../../../../token/ERC1155/base/ERC1155MetadataURIWithBaseURIBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ERC1155ProxiedMock is ERC1155SimpleProxiedMock, ERC1155DeliverableBase, ERC1155MetadataURIWithBaseURIBase {
    using TokenMetadataWithBaseURIStorage for TokenMetadataWithBaseURIStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ERC1155SimpleProxiedMock(forwarderRegistry) {}

    function init(string calldata baseMetadataURI) public virtual {
        super.init();
        ERC1155Storage.initERC1155Deliverable();
        ERC1155Storage.initERC1155MetadataURI();
        TokenMetadataWithBaseURIStorage.layout().proxyInit(baseMetadataURI);
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
