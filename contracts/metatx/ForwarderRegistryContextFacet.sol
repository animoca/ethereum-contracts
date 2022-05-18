// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC2771} from "./interfaces/IERC2771.sol";
import {IForwarderRegistry} from "./interfaces/IForwarderRegistry.sol";

// This contract has been derived from wighawag/universal-forwarder
// See https://github.com/wighawag/universal-forwarder/blob/5e16fad4d7bb99a7d4f32599787a6e240396d47c/src/solc_0.7/ERC2771/UsingUniversalForwarding.sol
contract ForwarderRegistryContextFacet is IERC2771 {
    IForwarderRegistry public immutable forwarderRegistry;

    constructor(IForwarderRegistry forwarderRegistry_) {
        forwarderRegistry = forwarderRegistry_;
    }

    /// @inheritdoc IERC2771
    function isTrustedForwarder(address forwarder) external view virtual override returns (bool) {
        return forwarder == address(forwarderRegistry);
    }
}
