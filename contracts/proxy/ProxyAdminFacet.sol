// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./libraries/LibProxyAdmin.sol";
import {ProxyAdminBase} from "./ProxyAdminBase.sol";

/**
 * @title ERC1967 Standard Proxy Storage Slots, Admin Address (facet version).
 * @dev See https://eips.ethereum.org/EIPS/eip-1967
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 * @dev Note: This facet depends on {OwnableFacet}.
 */
contract ProxyAdminFacet is ProxyAdminBase {
    function initProxyAdminStorage(address initialAdmin) external {
        LibProxyAdmin.initProxyAdminStorage(initialAdmin);
    }
}
