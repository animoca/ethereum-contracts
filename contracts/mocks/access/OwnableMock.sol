// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {OwnershipStorage} from "./../../access/libraries/OwnershipStorage.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract OwnableMock is Ownable {
    using OwnershipStorage for OwnershipStorage.Layout;

    constructor(address owner_) Ownable(owner_) {}

    function enforceIsContractOwner(address account) external view {
        OwnershipStorage.layout().enforceIsContractOwner(account);
    }
}
