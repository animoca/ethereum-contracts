// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {PayoutWallet} from "./../../payment/PayoutWallet.sol";
import {ContractOwnership} from "./../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../metatx/ForwarderRegistryContext.sol";

contract PayoutWalletMock is PayoutWallet, ForwarderRegistryContext {
    constructor(
        address payable initialPayoutWallet,
        IForwarderRegistry forwarderRegistry
    ) PayoutWallet(initialPayoutWallet) ContractOwnership(msg.sender) ForwarderRegistryContext(forwarderRegistry) {}

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
