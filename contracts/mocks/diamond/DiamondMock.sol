// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IDiamondCutBase} from "./../../diamond/interfaces/IDiamondCutBase.sol";
import {DiamondStorage} from "./../../diamond/libraries/DiamondStorage.sol";
import {Diamond} from "./../../diamond/Diamond.sol";

contract DiamondMock is Diamond {
    using DiamondStorage for DiamondStorage.Layout;

    event ImmutableFunctionCalled();

    constructor(IDiamondCutBase.FacetCut[] memory cuts, IDiamondCutBase.Initialization[] memory initializations)
        payable
        Diamond(cuts, initializations)
    {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = DiamondMock.immutableFunction.selector;
        IDiamondCutBase.FacetCut[] memory cut = new IDiamondCutBase.FacetCut[](1);
        cut[0].facetAddress = address(this);
        cut[0].action = IDiamondCutBase.FacetCutAction.Add;
        cut[0].functionSelectors = selectors;

        DiamondStorage.layout().diamondCut(cut, address(0), "");
    }

    function immutableFunction() external {
        emit ImmutableFunctionCalled();
    }
}
