// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

library StorageVersion {
    /// @notice Sets the version of a structured storage slot.
    /// @dev Reverts if `version` has been reached already.
    /// @param storageSlot the storage slot where the version is stored.
    /// @param version the version to set.
    function setVersion(bytes32 storageSlot, uint256 version) internal {
        StorageSlot.Uint256Slot storage currentVersion = StorageSlot.getUint256Slot(storageSlot);
        require(currentVersion.value < version, "Storage: version reached");
        currentVersion.value = version;
    }
}
