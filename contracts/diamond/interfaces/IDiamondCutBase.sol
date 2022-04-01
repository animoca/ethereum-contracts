// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
pragma experimental ABIEncoderV2;

interface IDiamondCutBase {
    enum FacetCutAction {
        Add,
        Replace,
        Remove
    }
    // Add=0, Replace=1, Remove=2

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    struct Initialization {
        address initContract;
        bytes initData;
    }

    /// @notice Emitted when at least a cut action is operated on the diamond.
    /// @param cuts The list of facet addresses, actions and function selectors applied to the diamond.
    /// @param target The address of the contract where `data` was executed.
    /// @param data The encoded function call executed on `target`.
    event DiamondCut(FacetCut[] cuts, address target, bytes data);
}
