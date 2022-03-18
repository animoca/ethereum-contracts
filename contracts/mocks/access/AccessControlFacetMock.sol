// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibAccessControl} from "./../../access/libraries/LibAccessControl.sol";
import {AccessControlFacet} from "./../../access/AccessControlFacet.sol";

contract AccessControlFacetMock is AccessControlFacet {
    bytes32 public constant TEST_ROLE = "tester";

    function enforceHasRole(bytes32 role, address account) external view {
        LibAccessControl.enforceHasRole(role, account);
    }
}
