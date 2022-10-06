// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IForwarderRegistry} from "../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155Storage} from "../../../../token/ERC1155/libraries/ERC1155Storage.sol";
import {ERC1155ProxiedMock} from "./ERC1155ProxiedMock.sol";
import {ERC1155BurnableBase} from "./../../../../token/ERC1155/base/ERC1155BurnableBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ERC1155BurnableProxiedMock is ERC1155ProxiedMock, ERC1155BurnableBase {
    constructor(IForwarderRegistry forwarderRegistry) ERC1155ProxiedMock(forwarderRegistry) {}

    function init() public virtual override {
        super.init();
        ERC1155Storage.initERC1155Burnable();
    }

    /// @inheritdoc ERC1155ProxiedMock
    function _msgSender() internal view virtual override(Context, ERC1155ProxiedMock) returns (address) {
        return ERC1155ProxiedMock._msgSender();
    }

    /// @inheritdoc ERC1155ProxiedMock
    function _msgData() internal view virtual override(Context, ERC1155ProxiedMock) returns (bytes calldata) {
        return ERC1155ProxiedMock._msgData();
    }
}
