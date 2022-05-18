// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {InterfaceDetectionStorage} from "./libraries/InterfaceDetectionStorage.sol";
import {ERC165Base} from "./ERC165Base.sol";
import {ForwarderRegistryContextBase} from "./../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC165 Interface Detection Standard (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}.
contract ERC165Facet is ERC165Base, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initialises the storage.
    /// @notice Sets the interface detection storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC165.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the interface detection storage is already initialized to version `1` or above.
    function initInterfaceDetectionStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        InterfaceDetectionStorage.layout().init();
    }
}
