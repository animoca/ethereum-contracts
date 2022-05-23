// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

contract ContractOwnershipMock is ContractOwnership, ForwarderRegistryContextBase {
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    constructor(address initialOwner, IForwarderRegistry forwarderRegistry)
        ContractOwnership(initialOwner)
        ForwarderRegistryContextBase(forwarderRegistry)
    {}

    function enforceIsContractOwner(address account) external view {
        ContractOwnershipStorage.layout().enforceIsContractOwner(account);
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
