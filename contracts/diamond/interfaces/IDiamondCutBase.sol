// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IDiamondCutBase {
    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);

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
}
