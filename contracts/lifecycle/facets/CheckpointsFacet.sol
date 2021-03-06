// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {CheckpointsStorage} from "./../libraries/CheckpointsStorage.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {CheckpointsBase} from "./../base/CheckpointsBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/base/ForwarderRegistryContextBase.sol";

/// @title Timestamp-based checkpoints management (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {ContractOwnershipFacet}.
contract CheckpointsFacet is CheckpointsBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using CheckpointsStorage for CheckpointsStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage with a list of initial checkpoints.
    /// @notice Sets the proxy initialization phase to `1`.
    /// @dev Reverts if the caller is not the proxy admin.
    /// @dev Reverts if the proxy initialization phase is set to `1` or above.
    /// @dev Reverts if `checkpointIds` and `timestamps` have different lengths.
    /// @dev Emits a {CheckpointSet} event for each timestamp set with a non-zero value.
    /// @param checkpointIds The checkpoint identifiers.
    /// @param timestamps The checkpoint timestamps.
    function initCheckpointsStorage(bytes32[] memory checkpointIds, uint256[] memory timestamps) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        CheckpointsStorage.layout().proxyInit(checkpointIds, timestamps);
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
