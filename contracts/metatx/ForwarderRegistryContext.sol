// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IForwarderRegistry} from "./interfaces/IForwarderRegistry.sol";
import {IERC2771} from "./interfaces/IERC2771.sol";
import {ForwarderRegistryContextBase} from "./ForwarderRegistryContextBase.sol";

// This contract has been derived from wighawag/universal-forwarder
// See https://github.com/wighawag/universal-forwarder/blob/5e16fad4d7bb99a7d4f32599787a6e240396d47c/src/solc_0.7/ERC2771/UsingUniversalForwarding.sol
abstract contract ForwarderRegistryContext is ForwarderRegistryContextBase, IERC2771 {
    constructor(IForwarderRegistry forwarderRegistry_) ForwarderRegistryContextBase(forwarderRegistry_) {}

    function forwarderRegistry() external view returns (IForwarderRegistry) {
        return _forwarderRegistry;
    }

    /// @inheritdoc IERC2771
    function isTrustedForwarder(address forwarder) external view virtual override returns (bool) {
        return forwarder == address(_forwarderRegistry);
    }
}
