// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IDiamondCutBase} from "./../interfaces/IDiamondCutBase.sol";
import {IDiamondLoupe} from "./../interfaces/IDiamondLoupe.sol";

library LibDiamond {
    using Address for address;

    event DiamondCut(IDiamondCutBase.FacetCut[] _diamondCut, address _init, bytes _calldata);

    bytes32 public constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array
    }

    struct DiamondStorage {
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        address[] facetAddresses;
    }

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function facets() internal view returns (IDiamondLoupe.Facet[] memory facets_) {
        DiamondStorage storage ds = diamondStorage();
        uint256 numFacets = ds.facetAddresses.length;
        facets_ = new IDiamondLoupe.Facet[](numFacets);
        for (uint256 i; i < numFacets; i++) {
            address facet = ds.facetAddresses[i];
            facets_[i].facetAddress = facet;
            facets_[i].functionSelectors = ds.facetFunctionSelectors[facet].functionSelectors;
        }
    }

    function facetFunctionSelectors(address facet) internal view returns (bytes4[] memory) {
        return diamondStorage().facetFunctionSelectors[facet].functionSelectors;
    }

    function facetAddresses() internal view returns (address[] memory) {
        return diamondStorage().facetAddresses;
    }

    function facetAddress(bytes4 selector) internal view returns (address) {
        return diamondStorage().selectorToFacetAndPosition[selector].facetAddress;
    }

    function diamondCut(
        IDiamondCutBase.FacetCut[] memory diamondCut_,
        address init_,
        bytes memory calldata_
    ) internal {
        cutFacets(diamondCut_);
        emit DiamondCut(diamondCut_, init_, calldata_);
        initializationCall(init_, calldata_);
    }

    function diamondCut(IDiamondCutBase.FacetCut[] memory diamondCut_, IDiamondCutBase.Initialization[] memory initializations_) internal {
        cutFacets(diamondCut_);
        emit DiamondCut(diamondCut_, address(0), "");
        for (uint256 i = 0; i < initializations_.length; i++) {
            initializationCall(initializations_[i].initContract, initializations_[i].initData);
        }
    }

    function cutFacets(IDiamondCutBase.FacetCut[] memory diamondCut_) internal {
        for (uint256 facetIndex; facetIndex < diamondCut_.length; facetIndex++) {
            IDiamondCutBase.FacetCutAction action = diamondCut_[facetIndex].action;
            if (action == IDiamondCutBase.FacetCutAction.Add) {
                addFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            } else if (action == IDiamondCutBase.FacetCutAction.Replace) {
                replaceFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            } else {
                /*if (action == IDiamondCutBase.FacetCutAction.Remove)*/
                removeFunctions(diamondCut_[facetIndex].facetAddress, diamondCut_[facetIndex].functionSelectors);
            }
        }
    }

    function addFunctions(address facet, bytes4[] memory selectors) internal {
        require(facet != address(0), "Diamond: zero address facet");
        require(selectors.length > 0, "Diamond: no function selectors");
        DiamondStorage storage ds = diamondStorage();
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[facet].functionSelectors.length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(ds, facet);
        }
        for (uint256 selectorIndex; selectorIndex < selectors.length; selectorIndex++) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "Diamond: existing function");
            addFunction(ds, selector, selectorPosition, facet);
            selectorPosition++;
        }
    }

    function replaceFunctions(address facet, bytes4[] memory selectors) internal {
        require(facet != address(0), "Diamond: zero address facet");
        require(selectors.length > 0, "Diamond: no function selectors");
        DiamondStorage storage ds = diamondStorage();
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[facet].functionSelectors.length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(ds, facet);
        }
        for (uint256 selectorIndex; selectorIndex < selectors.length; selectorIndex++) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != facet, "Diamond: identical function");
            removeFunction(ds, oldFacetAddress, selector);
            addFunction(ds, selector, selectorPosition, facet);
            selectorPosition++;
        }
    }

    function removeFunctions(address facet, bytes4[] memory selectors) internal {
        require(facet == address(0), "Diamond: non-zero address facet");
        require(selectors.length > 0, "Diamond: no function selectors");
        DiamondStorage storage ds = diamondStorage();
        for (uint256 selectorIndex; selectorIndex < selectors.length; selectorIndex++) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            removeFunction(ds, oldFacetAddress, selector);
        }
    }

    function addFacet(DiamondStorage storage ds, address facet) internal {
        if (facet != address(this)) {
            require(facet.isContract(), "Diamond: facet has no code");
        }
        ds.facetFunctionSelectors[facet].facetAddressPosition = ds.facetAddresses.length;
        ds.facetAddresses.push(facet);
    }

    function addFunction(
        DiamondStorage storage ds,
        bytes4 selector,
        uint96 selectorPosition,
        address facet
    ) internal {
        ds.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
        ds.facetFunctionSelectors[facet].functionSelectors.push(selector);
        ds.selectorToFacetAndPosition[selector].facetAddress = facet;
    }

    function removeFunction(
        DiamondStorage storage ds,
        address facet,
        bytes4 selector
    ) internal {
        require(facet != address(0), "Diamond: function not found");
        // an immutable function is a function defined directly in a diamond
        require(facet != address(this), "Diamond: immutable function");
        // replace selector with last selector, then delete last selector
        uint256 selectorPosition = ds.selectorToFacetAndPosition[selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.facetFunctionSelectors[facet].functionSelectors.length - 1;
        // if not the same then replace selector with lastSelector
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = ds.facetFunctionSelectors[facet].functionSelectors[lastSelectorPosition];
            ds.facetFunctionSelectors[facet].functionSelectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }
        // delete the last selector
        ds.facetFunctionSelectors[facet].functionSelectors.pop();
        delete ds.selectorToFacetAndPosition[selector];

        // if no more selectors for facet address then delete the facet address
        if (lastSelectorPosition == 0) {
            // replace facet address with last facet address and delete last facet address
            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
            uint256 facetAddressPosition = ds.facetFunctionSelectors[facet].facetAddressPosition;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;
            }
            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[facet].facetAddressPosition;
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
}
