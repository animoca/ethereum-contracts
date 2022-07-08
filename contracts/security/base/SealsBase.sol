// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {SealsStorage} from "./../libraries/SealsStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

abstract contract SealsBase is Context {
    using SealsStorage for SealsStorage.Layout;

    bytes32 public constant SEALER_ROLE = "sealer";

    event Sealed(uint256 sealId, address sealer);

    function isSealed(uint256 sealId) external view returns (bool) {
        return SealsStorage.layout().isSealed(sealId);
    }
}
