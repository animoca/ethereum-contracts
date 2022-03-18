// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../../proxy/libraries/LibProxyAdmin.sol";
import {ProxyAdmin} from "./../../proxy/ProxyAdmin.sol";

contract ProxyAdminMock is ProxyAdmin {
    constructor(address admin) ProxyAdmin(admin) {}

    function enforceIsProxyAdmin(address account) external view {
        LibProxyAdmin.enforceIsProxyAdmin(account);
    }
}
