// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {SealedCall} from "./SealedCall.sol";
import {ContractOwnership} from "./../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../metatx/base/ForwarderRegistryContextBase.sol";

/// @title Sealead executions via calls on target contracts.
/// @notice Enables contract calls to be performed uniquely thanks to a seal identifier.
/// @notice Multiple executions can happen for example due to automation bugs in a backend or in a script.
/// @notice Typically, it can be a good practice to protect the minting of fungible tokens with an immutable seal identifier,
/// @notice such as a constant defined in a script or in a unique database field.
contract SealedCallExecutor is SealedCall, ForwarderRegistryContextBase {
    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) ContractOwnership(msg.sender) {}

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}
