// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibAccessControl} from "./../../access/libraries/LibAccessControl.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract AccessControlMock is AccessControl {
    bytes32 public constant TEST_ROLE = "tester";

    constructor() Ownable(msg.sender) {}

    function enforceHasRole(bytes32 role, address account) external view {
        LibAccessControl.enforceHasRole(role, account);
    }
}
