// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ProxyAdmin} from "./../../proxy/ProxyAdmin.sol";

contract ProxyAdminMock is ProxyAdmin {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;

    constructor(address admin) ProxyAdmin(admin) {}

    function enforceIsProxyAdmin(address account) external view {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(account);
    }
}
