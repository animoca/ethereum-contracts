// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibOwnership} from "./../../access/libraries/LibOwnership.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract OwnableMock is Ownable {
    constructor(address owner_) Ownable(owner_) {}

    function enforceIsContractOwner(address account) external view {
        LibOwnership.enforceIsContractOwner(account);
    }
}
