// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {SafeContractOwnershipStorage} from "./../../../access/libraries/SafeContractOwnershipStorage.sol";
import {SafeContractOwnershipFacet} from "./../../../access/facets/SafeContractOwnershipFacet.sol";

contract SafeContractOwnershipFacetMock is SafeContractOwnershipFacet {
    using SafeContractOwnershipStorage for SafeContractOwnershipStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) SafeContractOwnershipFacet(forwarderRegistry) {}

    function enforceIsContractOwner(address account) external view {
        SafeContractOwnershipStorage.layout().enforceIsContractOwner(account);
    }

    function enforceIsTargetContractOwner(address targetContract, address account) external view {
        SafeContractOwnershipStorage.enforceIsTargetContractOwner(targetContract, account);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
