// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./../../access/libraries/LibOwnership.sol";
import {OwnableFacet} from "./../../access/OwnableFacet.sol";

contract OwnableFacetMock is OwnableFacet {
    function enforceIsContractOwner(address account) external view {
        LibOwnership.enforceIsContractOwner(account);
    }
}
