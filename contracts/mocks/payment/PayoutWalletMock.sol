// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {PayoutWallet} from "./../../payment/PayoutWallet.sol";
import {Ownable} from "./../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

contract PayoutWalletMock is PayoutWallet, ForwarderRegistryContextBase {
    constructor(address payable initialPayoutWallet, IForwarderRegistry forwarderRegistry)
        PayoutWallet(initialPayoutWallet)
        Ownable(msg.sender)
        ForwarderRegistryContextBase(forwarderRegistry)
    {}

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
