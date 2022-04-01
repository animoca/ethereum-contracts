// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IForwarderRegistry} from "./interfaces/IForwarderRegistry.sol";
import {IERC2771} from "./interfaces/IERC2771.sol";
import {ERC2771Data} from "./libraries/ERC2771Data.sol";

abstract contract ForwarderRegistryContext is IERC2771 {
    IForwarderRegistry public immutable _forwarderRegistry;

    constructor(IForwarderRegistry forwarderRegistry) {
        _forwarderRegistry = forwarderRegistry;
    }

    /// @inheritdoc IERC2771
    function isTrustedForwarder(address forwarder) external view virtual override returns (bool) {
        return forwarder == address(_forwarderRegistry);
    }

    /// @notice Returns the message sender depending on the ForwarderRegistry-based meta-transaction context.
    function _msgSender() internal view virtual returns (address) {
        address msgSender = msg.sender;

        // Optimised path in case of an EOA-initiated direct transaction to the contract
        // solhint-disable-next-line avoid-tx-origin
        if (msgSender == tx.origin) {
            return msgSender;
        }

        address sender = ERC2771Data.msgSender();

        // Return the EIP-2771 calldata-appended sender address if the message was forwarded by the ForwarderRegistry or an approved forwarder
        if (msgSender == address(_forwarderRegistry) || _forwarderRegistry.isForwarderFor(sender, msgSender)) {
            return sender;
        }

        return msgSender;
    }

    /// @notice Returns the message data depending on the ForwarderRegistry-based meta-transaction context.
    function _msgData() internal view virtual returns (bytes calldata data) {
        address msgSender = msg.sender;

        // Optimised path in case of an EOA-initiated direct transaction to the contract
        // solhint-disable-next-line avoid-tx-origin
        if (msgSender == tx.origin) {
            return msg.data;
        }

        // Return the EIP-2771 calldata (minus the appended sender) if the message was forwarded by the ForwarderRegistry or an approved forwarder
        if (msgSender == address(_forwarderRegistry) || _forwarderRegistry.isForwarderFor(ERC2771Data.msgSender(), msgSender)) {
            return ERC2771Data.msgData();
        }

        return msg.data;
    }
}
