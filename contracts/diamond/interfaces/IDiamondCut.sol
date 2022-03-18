// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IDiamondCutBase} from "./IDiamondCutBase.sol";

/**
 * @title ERC2535 Diamond Standard, Diamond Cut.
 * @dev See https://eips.ethereum.org/EIPS/eip-2535
 * Note: the ERC-165 identifier for this interface is 0x1f931c1c
 */
interface IDiamondCut is IDiamondCutBase {
    /**
     * Add/replace/remove facet functions and optionally execute a function with delegatecall.
     * @param diamondCut_ Contains the facet addresses and function selectors.
     * @param init_ The address of the contract or facet to execute calldata_.
     * @param calldata_ The encoded function call to be executed on `init_`.
     */
    function diamondCut(
        FacetCut[] calldata diamondCut_,
        address init_,
        bytes calldata calldata_
    ) external;
}
