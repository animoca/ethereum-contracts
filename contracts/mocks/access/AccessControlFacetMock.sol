// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {AccessControlFacet} from "./../../access/AccessControlFacet.sol";

contract AccessControlFacetMock is AccessControlFacet {
    using AccessControlStorage for AccessControlStorage.Layout;

    bytes32 public constant TEST_ROLE = "tester";

    function enforceHasRole(bytes32 role, address account) external view {
        AccessControlStorage.layout().enforceHasRole(role, account);
    }
}
