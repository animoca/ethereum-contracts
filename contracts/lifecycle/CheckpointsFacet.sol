// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibCheckpoints} from "./libraries/LibCheckpoints.sol";
import {CheckpointsBase} from "./CheckpointsBase.sol";

/**
 * @title Timestamp-based checkpoints management (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 * @dev Note: This facet depends on {OwnableFacet}.
 */
contract CheckpointsFacet is CheckpointsBase {
    /**
     * Initialises the storage with a list of initial checkpoints.
     * @dev reverts if the caller is not the proxy admin.
     * @dev reverts if `checkpointIds` and `timestamps` have different lengths.
     * @dev emits a {CheckpointSet} event for each checkpoint set.
     * @param checkpointIds the checkpoint identifiers.
     * @param timestamps the checkpoint timestamps.
     */
    function initCheckpointsStorage(bytes32[] memory checkpointIds, uint256[] memory timestamps) external {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibCheckpoints.initCheckpointsStorage(checkpointIds, timestamps);
    }
}
