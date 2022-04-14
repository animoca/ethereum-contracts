// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {OwnershipStorage} from "./../../access/libraries/OwnershipStorage.sol";
import {Ownable} from "./../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

contract OwnableMock is Ownable, ForwarderRegistryContextBase {
    using OwnershipStorage for OwnershipStorage.Layout;

    constructor(address initialOwner, IForwarderRegistry forwarderRegistry) Ownable(initialOwner) ForwarderRegistryContextBase(forwarderRegistry) {}

    function enforceIsContractOwner(address account) external view {
        OwnershipStorage.layout().enforceIsContractOwner(account);
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
