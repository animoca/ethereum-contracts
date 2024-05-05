// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {SafeContractOwnershipStorage} from "./../../access/libraries/SafeContractOwnershipStorage.sol";
import {SafeContractOwnership} from "./../../access/SafeContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../metatx/ForwarderRegistryContext.sol";

contract SafeContractOwnershipMock is SafeContractOwnership, ForwarderRegistryContext {
    using SafeContractOwnershipStorage for SafeContractOwnershipStorage.Layout;

    constructor(
        address initialOwner,
        IForwarderRegistry forwarderRegistry
    ) SafeContractOwnership(initialOwner) ForwarderRegistryContext(forwarderRegistry) {}

    function enforceIsContractOwner(address account) external view {
        SafeContractOwnershipStorage.layout().enforceIsContractOwner(account);
    }

    function enforceIsTargetContractOwner(address targetContract, address account) external view {
        SafeContractOwnershipStorage.enforceIsTargetContractOwner(targetContract, account);
    }

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
