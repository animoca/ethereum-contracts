// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ProxyAdminFacet} from "./../../proxy/ProxyAdminFacet.sol";

contract ProxyAdminFacetMock is ProxyAdminFacet {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;

    function enforceIsProxyAdmin(address account) external view {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(account);
    }
}
