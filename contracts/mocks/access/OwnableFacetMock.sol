// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {OwnershipStorage} from "./../../access/libraries/OwnershipStorage.sol";
import {OwnableFacet} from "./../../access/OwnableFacet.sol";

contract OwnableFacetMock is OwnableFacet {
    using OwnershipStorage for OwnershipStorage.Layout;

    function enforceIsContractOwner(address account) external view {
        OwnershipStorage.layout().enforceIsContractOwner(account);
    }
}
