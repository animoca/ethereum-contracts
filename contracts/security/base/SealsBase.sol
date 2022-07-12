// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {SealsStorage} from "./../libraries/SealsStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

abstract contract SealsBase is Context {
    using SealsStorage for SealsStorage.Layout;

    /// @notice Emitted when a seal is used.
    /// @param sealId the seal identifier.
    /// @param sealer the sealer address.
    event Sealed(uint256 sealId, address sealer);

    /// @notice Retrieves whether a seal has been used already.
    /// @param sealId the seal identifier.
    /// @return wasSealed Whether a seal has been used already.
    function isSealed(uint256 sealId) external view returns (bool wasSealed) {
        return SealsStorage.layout().isSealed(sealId);
    }
}
