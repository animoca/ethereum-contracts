// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IForwarderRegistry} from "./interfaces/IForwarderRegistry.sol";
import {IERC2771} from "./interfaces/IERC2771.sol";
import {ForwarderRegistryContextBase} from "./base/ForwarderRegistryContextBase.sol";

/// @title Meta-Transactions Forwarder Registry Context (immutable version).
/// @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
/// @dev Derived from https://github.com/wighawag/universal-forwarder (MIT licence)
abstract contract ForwarderRegistryContext is ForwarderRegistryContextBase, IERC2771 {
    /// @param forwarderRegistry_ The ForwarderRegistry contract address, or the zero address to disable meta-transactions.
    constructor(IForwarderRegistry forwarderRegistry_) ForwarderRegistryContextBase(forwarderRegistry_) {}

    function forwarderRegistry() external view returns (IForwarderRegistry) {
        return _FORWARDER_REGISTRY;
    }

    /// @inheritdoc IERC2771
    function isTrustedForwarder(address forwarder) external view virtual returns (bool) {
        // ERC2771 meta-transactions disabled
        if (_FORWARDER_REGISTRY == IForwarderRegistry(address(0))) {
            return false;
        }

        return forwarder == address(_FORWARDER_REGISTRY);
    }
}
