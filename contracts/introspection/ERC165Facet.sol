// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibInterfaceDetection} from "./libraries/LibInterfaceDetection.sol";
import {ERC165Base} from "./ERC165Base.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ERC165 Interface Detection Standard (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 */
contract ERC165Facet is ERC165Base, Context {
    function initInterfaceDetectionStorage() external {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        return LibInterfaceDetection.initInterfaceDetectionStorage();
    }
}
