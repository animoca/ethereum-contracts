// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {OwnershipStorage} from "./../../access/libraries/OwnershipStorage.sol";
import {OwnableFacet} from "./../../access/OwnableFacet.sol";

contract OwnableFacetMock is OwnableFacet {
    using OwnershipStorage for OwnershipStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) OwnableFacet(forwarderRegistry) {}

    function enforceIsContractOwner(address account) external view {
        OwnershipStorage.layout().enforceIsContractOwner(account);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
