// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {AccessControlFacet} from "./../../access/AccessControlFacet.sol";

contract AccessControlFacetMock is AccessControlFacet {
    using AccessControlStorage for AccessControlStorage.Layout;

    bytes32 public constant TEST_ROLE = "tester";

    constructor(IForwarderRegistry forwarderRegistry) AccessControlFacet(forwarderRegistry) {}

    function enforceHasRole(bytes32 role, address account) external view {
        AccessControlStorage.layout().enforceHasRole(role, account);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
