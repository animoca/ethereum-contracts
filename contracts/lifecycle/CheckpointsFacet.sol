// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {CheckpointsStorage} from "./libraries/CheckpointsStorage.sol";
import {CheckpointsBase} from "./CheckpointsBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../metatx/ForwarderRegistryContextBase.sol";

/// @title Timestamp-based checkpoints management (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {ContractOwnershipFacet}.
contract CheckpointsFacet is CheckpointsBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using CheckpointsStorage for CheckpointsStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage with a list of initial checkpoints.
    /// @notice Sets the checkpoints storage version to `1`.
    /// @dev Reverts if the caller is not the proxy admin.
    /// @dev Reverts if the checkpoints storage is already initialized to version `1` or above.
    /// @dev Reverts if `checkpointIds` and `timestamps` have different lengths.
    /// @dev Emits a {CheckpointSet} event for each timestamp set with a non-zero value.
    /// @param checkpointIds the checkpoint identifiers.
    /// @param timestamps the checkpoint timestamps.
    function initCheckpointsStorage(bytes32[] memory checkpointIds, uint256[] memory timestamps) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        CheckpointsStorage.layout().init(checkpointIds, timestamps);
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
