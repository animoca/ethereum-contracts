// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../../proxy/libraries/LibProxyAdmin.sol";
import {ProxyAdminFacet} from "./../../proxy/ProxyAdminFacet.sol";

contract ProxyAdminFacetMock is ProxyAdminFacet {
    function enforceIsProxyAdmin(address account) external view {
        LibProxyAdmin.enforceIsProxyAdmin(account);
    }
}
