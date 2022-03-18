// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

library StorageVersion {
    function setVersion(bytes32 storageSlot, uint256 version) internal {
        StorageSlot.Uint256Slot storage currentVersion = StorageSlot.getUint256Slot(storageSlot);
        require(currentVersion.value < version, "Storage: version reached");
        currentVersion.value = version;
    }
}
