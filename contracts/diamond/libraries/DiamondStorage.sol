// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
pragma experimental ABIEncoderV2;

import {IDiamondCutBase} from "./../interfaces/IDiamondCutBase.sol";
import {IDiamondLoupe} from "./../interfaces/IDiamondLoupe.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

library DiamondStorage {
    using Address for address;
    using DiamondStorage for DiamondStorage.Layout;

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array
    }

    struct Layout {
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        mapping(address => FacetFunctionSelectors) functionSelectors;
        address[] facetAddresses;
    }

    bytes32 public constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    event DiamondCut(IDiamondCutBase.FacetCut[] cuts, address target, bytes data);

    function diamondCut(
        Layout storage s,
        IDiamondCutBase.FacetCut[] memory cuts,
        address target,
        bytes memory data
    ) internal {
        cutFacets(s, cuts);
        emit DiamondCut(cuts, target, data);
        initializationCall(target, data);
    }

    function diamondCut(
        Layout storage s,
        IDiamondCutBase.FacetCut[] memory cuts,
        IDiamondCutBase.Initialization[] memory initializations
    ) internal {
        s.cutFacets(cuts);
        emit DiamondCut(cuts, address(0), "");
        uint256 nbInitializations = initializations.length;
        for (uint256 i; i < nbInitializations; ++i) {
            initializationCall(initializations[i].initContract, initializations[i].initData);
        }
    }

    function cutFacets(Layout storage s, IDiamondCutBase.FacetCut[] memory diamondCut_) internal {
        uint256 nbCuts = diamondCut_.length;
        for (uint256 facetIndex; facetIndex < nbCuts; ++facetIndex) {
            IDiamondCutBase.FacetCutAction action = diamondCut_[facetIndex].action;
            if (action == IDiamondCutBase.FacetCutAction.Add) {
                s.addFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            } else if (action == IDiamondCutBase.FacetCutAction.Replace) {
                s.replaceFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            } else {
                /*if (action == IDiamondCutBase.FacetCutAction.Remove)*/
                s.removeFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            }
        }
    }

    function addFunctions(
        Layout storage s,
        address facet,
        bytes4[] memory selectors
    ) internal {
        require(facet != address(0), "Diamond: zero address facet");
        uint256 nbSelectors = selectors.length;
        require(nbSelectors > 0, "Diamond: no function selectors");
        uint96 selectorPosition = uint96(s.functionSelectors[facet].functionSelectors.length);
        if (selectorPosition == 0) {
            s.addFacet(facet);
        }
        for (uint256 selectorIndex; selectorIndex < nbSelectors; ++selectorIndex) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = s.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "Diamond: existing function");
            s.addFunction(selector, selectorPosition, facet);
            selectorPosition++;
        }
    }

    function replaceFunctions(
        Layout storage s,
        address facet,
        bytes4[] memory selectors
    ) internal {
        require(facet != address(0), "Diamond: zero address facet");
        uint256 nbSelectors = selectors.length;
        require(nbSelectors > 0, "Diamond: no function selectors");
        uint96 selectorPosition = uint96(s.functionSelectors[facet].functionSelectors.length);
        if (selectorPosition == 0) {
            s.addFacet(facet);
        }
        for (uint256 selectorIndex; selectorIndex < nbSelectors; ++selectorIndex) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = s.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != facet, "Diamond: identical function");
            s.removeFunction(oldFacetAddress, selector);
            s.addFunction(selector, selectorPosition, facet);
            selectorPosition++;
        }
    }

    function removeFunctions(
        Layout storage s,
        address facet,
        bytes4[] memory selectors
    ) internal {
        require(facet == address(0), "Diamond: non-zero address facet");
        uint256 nbSelectors = selectors.length;
        require(nbSelectors > 0, "Diamond: no function selectors");
        for (uint256 selectorIndex; selectorIndex < nbSelectors; ++selectorIndex) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = s.selectorToFacetAndPosition[selector].facetAddress;
            s.removeFunction(oldFacetAddress, selector);
        }
    }

    function addFacet(Layout storage s, address facet) internal {
        if (facet != address(this)) {
            require(facet.isContract(), "Diamond: facet has no code");
        }
        s.functionSelectors[facet].facetAddressPosition = s.facetAddresses.length;
        s.facetAddresses.push(facet);
    }

    function addFunction(
        Layout storage s,
        bytes4 selector,
        uint96 selectorPosition,
        address facet
    ) internal {
        s.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
        s.functionSelectors[facet].functionSelectors.push(selector);
        s.selectorToFacetAndPosition[selector].facetAddress = facet;
    }

    function removeFunction(
        Layout storage s,
        address facet,
        bytes4 selector
    ) internal {
        require(facet != address(0), "Diamond: function not found");
        // an immutable function is a function defined directly in a diamond
        require(facet != address(this), "Diamond: immutable function");
        // replace selector with last selector, then delete last selector
        uint256 selectorPosition = s.selectorToFacetAndPosition[selector].functionSelectorPosition;
        uint256 lastSelectorPosition = s.functionSelectors[facet].functionSelectors.length - 1;
        // if not the same then replace selector with lastSelector
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = s.functionSelectors[facet].functionSelectors[lastSelectorPosition];
            s.functionSelectors[facet].functionSelectors[selectorPosition] = lastSelector;
            s.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }
        // delete the last selector
        s.functionSelectors[facet].functionSelectors.pop();
        delete s.selectorToFacetAndPosition[selector];

        // if no more selectors for facet address then delete the facet address
        if (lastSelectorPosition == 0) {
            // replace facet address with last facet address and delete last facet address
            uint256 lastFacetAddressPosition = s.facetAddresses.length - 1;
            uint256 facetAddressPosition = s.functionSelectors[facet].facetAddressPosition;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = s.facetAddresses[lastFacetAddressPosition];
                s.facetAddresses[facetAddressPosition] = lastFacetAddress;
                s.functionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;
            }
            s.facetAddresses.pop();
            delete s.functionSelectors[facet].facetAddressPosition;
        }
    }

    function initializationCall(address init_, bytes memory calldata_) internal {
        if (init_ == address(0)) {
            require(calldata_.length == 0, "Diamond: calldata_ is not empty");
        } else {
            require(calldata_.length > 0, "Diamond: calldata_ is empty");
            if (init_ != address(this)) {
                require(init_.isContract(), "Diamond: init_ has no code");
            }
            (bool success, bytes memory error) = init_.delegatecall(calldata_);
            if (!success) {
                if (error.length > 0) {
                    revert(string(error));
                } else {
                    revert("Diamond: init_ call reverted");
                }
            }
        }
    }

    function facets(Layout storage s) internal view returns (IDiamondLoupe.Facet[] memory facets_) {
        uint256 nbFacets = s.facetAddresses.length;
        facets_ = new IDiamondLoupe.Facet[](nbFacets);
        for (uint256 i; i < nbFacets; ++i) {
            address facet = s.facetAddresses[i];
            facets_[i].facetAddress = facet;
            facets_[i].functionSelectors = s.functionSelectors[facet].functionSelectors;
        }
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
