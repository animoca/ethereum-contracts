// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract AccessControlMock is AccessControl {
    using AccessControlStorage for AccessControlStorage.Layout;

    bytes32 public constant TEST_ROLE = "tester";

    constructor() Ownable(msg.sender) {}

    function enforceHasRole(bytes32 role, address account) external view {
        AccessControlStorage.layout().enforceHasRole(role, account);
    }
}
