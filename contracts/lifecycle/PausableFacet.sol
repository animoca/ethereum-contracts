// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {PauseStorage} from "./libraries/PauseStorage.sol";
import {PausableBase} from "./PausableBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../metatx/ForwarderRegistryContextBase.sol";

/// @title Pausing mechanism (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {OwnableFacet}.
contract PausableFacet is PausableBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using PauseStorage for PauseStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage with an initial paused state.
    /// @notice Sets the pause storage version to `1`.
    /// @dev Reverts if the caller is not the proxy admin.
    /// @dev Reverts if the pause storage is already initialized to version `1` or above.
    /// @dev Emits a {Paused} event if `isPaused` is true.
    /// @param isPaused the initial pause state.
    function initPauseStorage(bool isPaused) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        PauseStorage.layout().init(isPaused);
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
