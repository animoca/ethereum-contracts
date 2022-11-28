// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IDiamondCutCommon} from "./../../diamond/interfaces/IDiamondCutCommon.sol";
import {DiamondStorage} from "./../../diamond/libraries/DiamondStorage.sol";
import {Diamond} from "./../../diamond/Diamond.sol";

contract DiamondMock is Diamond {
    using DiamondStorage for DiamondStorage.Layout;

    event ImmutableFunctionCalled();

    constructor(
        IDiamondCutCommon.FacetCut[] memory cuts,
        IDiamondCutCommon.Initialization[] memory initializations
    ) payable Diamond(cuts, initializations) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = DiamondMock.immutableFunction.selector;
        IDiamondCutCommon.FacetCut[] memory cut = new IDiamondCutCommon.FacetCut[](1);
        cut[0].facet = address(this);
        cut[0].action = IDiamondCutCommon.FacetCutAction.ADD;
        cut[0].selectors = selectors;

        DiamondStorage.layout().diamondCut(cut, address(0), "");
    }

    function immutableFunction() external {
        emit ImmutableFunctionCalled();
    }
}
