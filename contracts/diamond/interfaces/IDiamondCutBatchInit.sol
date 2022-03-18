// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IDiamondCutBase} from "./IDiamondCutBase.sol";

/**
 * @title ERCXXX Diamond Standard, Diamond Cut Batch Init extension facet.
 * @dev See https://eips.ethereum.org/EIPS/eip-XXXX
 * Note: the ERC-165 identifier for this interface is 0xb2afc5b5
 */
interface IDiamondCutBatchInit is IDiamondCutBase {
    /**
     * Add/replace/remove facet functions and execute a batch of functions with delegatecall.
     * @param diamondCut_ Contains the facet addresses and function selectors.
     * @param initializations_ The list of addresses and encoded function calls to execute with delegatecall.
     */
    function diamondCut(FacetCut[] calldata diamondCut_, Initialization[] calldata initializations_) external;
}
