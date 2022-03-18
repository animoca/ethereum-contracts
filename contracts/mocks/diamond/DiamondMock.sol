// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./../../diamond/libraries/LibDiamond.sol";
import {IDiamondCutBase} from "./../../diamond/interfaces/IDiamondCutBase.sol";
import {Diamond} from "./../../diamond/Diamond.sol";

contract DiamondMock is Diamond {
    event ImmutableFunctionCalled();

    constructor(IDiamondCutBase.FacetCut[] memory diamondCut_, IDiamondCutBase.Initialization[] memory initializations_)
        payable
        Diamond(diamondCut_, initializations_)
    {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = DiamondMock.immutableFunction.selector;
        IDiamondCutBase.FacetCut[] memory cut = new IDiamondCutBase.FacetCut[](1);
        cut[0].facetAddress = address(this);
        cut[0].action = IDiamondCutBase.FacetCutAction.Add;
        cut[0].functionSelectors = selectors;

        LibDiamond.diamondCut(cut, address(0), "");
    }

    function immutableFunction() external {
        emit ImmutableFunctionCalled();
    }
}
