// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20} from "./../../../token/ERC20/ERC20.sol";
import {ERC20Mintable} from "./../../../token/ERC20/ERC20Mintable.sol";
import {Ownable} from "./../../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";

contract ERC20SimpleMock is ERC20, ERC20Mintable, ForwarderRegistryContextBase {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        IForwarderRegistry forwarderRegistry
    ) ERC20(holders, allocations) Ownable(msg.sender) ForwarderRegistryContextBase(forwarderRegistry) {}

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
