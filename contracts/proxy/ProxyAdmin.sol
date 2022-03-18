// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./libraries/LibProxyAdmin.sol";
import {ProxyAdminBase} from "./ProxyAdminBase.sol";

/**
 * @title ERC1967 Standard Proxy Storage Slots, Admin Address (immutable version).
 * @dev See https://eips.ethereum.org/EIPS/eip-1967
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract ProxyAdmin is ProxyAdminBase {
    constructor(address initialAdmin) {
        LibProxyAdmin.initProxyAdminStorage(initialAdmin);
    }
}
