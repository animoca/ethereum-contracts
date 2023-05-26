// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IOperatorFilterRegistry} from "./../../../token/royalty/interfaces/IOperatorFilterRegistry.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC1155WithOperatorFilterer} from "./../../../token/ERC1155/ERC1155WithOperatorFilterer.sol";
import {ERC1155Mintable} from "./../../../token/ERC1155/ERC1155Mintable.sol";
import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../../metatx/ForwarderRegistryContext.sol";

contract ERC1155WithOperatorFiltererMock is ERC1155WithOperatorFilterer, ERC1155Mintable, ForwarderRegistryContext {
    constructor(
        IOperatorFilterRegistry filterRegistry,
        IForwarderRegistry forwarderRegistry
    ) ERC1155WithOperatorFilterer(filterRegistry) ContractOwnership(msg.sender) ForwarderRegistryContext(forwarderRegistry) {}

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
