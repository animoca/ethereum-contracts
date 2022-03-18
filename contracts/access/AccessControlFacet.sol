// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AccessControlBase} from "./AccessControlBase.sol";

/**
 * @title Access control via roles management (facet version).
 * @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
 * @dev Note: This facet depends on {OwnableFacet}.
 */
contract AccessControlFacet is AccessControlBase {

}
