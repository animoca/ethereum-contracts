// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {RecoverableBase} from "./RecoverableBase.sol";

/// @title Recovery mechanism for ERC20/ERC721 tokens accidentally sent to this contract (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {OwnableFacet}.
contract RecoverableFacet is RecoverableBase {

}
