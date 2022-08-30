// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20} from "./../../../token/ERC20/ERC20.sol";
import {ERC20Mintable} from "./../../../token/ERC20/ERC20Mintable.sol";
import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../../metatx/ForwarderRegistryContext.sol";

contract ERC20SimpleMock is ERC20, ERC20Mintable, ForwarderRegistryContext {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        IForwarderRegistry forwarderRegistry
    ) ERC20(holders, allocations) ContractOwnership(msg.sender) ForwarderRegistryContext(forwarderRegistry) {}

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
