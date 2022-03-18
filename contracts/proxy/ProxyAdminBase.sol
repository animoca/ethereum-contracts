// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./libraries/LibProxyAdmin.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ERC1967 Standard Proxy Storage Slots, Admin Address (proxiable version).
 * @dev See https://eips.ethereum.org/EIPS/eip-1967
 * @dev This contract is to be used via inheritance in a proxied implementation.
 * @dev `LibProxyAdmin.initProxyAdminStorage(initialAdmin)` should be called during contract initialisation.
 */
abstract contract ProxyAdminBase is Context {
    function proxyAdmin() public view returns (address) {
        return LibProxyAdmin.proxyAdmin();
    }

    function changeProxyAdmin(address newAdmin) external {
        LibProxyAdmin.changeProxyAdmin(newAdmin, _msgSender());
    }
}
