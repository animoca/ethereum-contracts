// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
pragma experimental ABIEncoderV2;

import {IDiamondCutBase} from "./../interfaces/IDiamondCutBase.sol";
import {IDiamondLoupe} from "./../interfaces/IDiamondLoupe.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

library DiamondStorage {
    using Address for address;
    using DiamondStorage for DiamondStorage.Layout;

    struct FunctionSelector {
        address diamondFacetAddress;
        uint96 position; // position in DiamondFacet.functionSelectors array
    }

    struct DiamondFacet {
        bytes4[] functionSelectors;
        uint256 position; // position in diamondFacetAddresses array
    }

    struct Layout {
        mapping(bytes4 => FunctionSelector) functionSelectors;
        mapping(address => DiamondFacet) diamondFacets;
        address[] diamondFacetAddresses;
    }

    bytes32 public constant DIAMOND_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.Diamond.storage")) - 1);

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
        uint96 selectorPosition = uint96(s.diamondFacets[facet].functionSelectors.length);
        if (selectorPosition == 0) {
            s.addFacet(facet);
        }
        for (uint256 selectorIndex; selectorIndex < nbSelectors; ++selectorIndex) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = s.functionSelectors[selector].diamondFacetAddress;
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
        uint96 selectorPosition = uint96(s.diamondFacets[facet].functionSelectors.length);
        if (selectorPosition == 0) {
            s.addFacet(facet);
        }
        for (uint256 selectorIndex; selectorIndex < nbSelectors; ++selectorIndex) {
            bytes4 selector = selectors[selectorIndex];
            address oldFacetAddress = s.functionSelectors[selector].diamondFacetAddress;
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
            address oldFacetAddress = s.functionSelectors[selector].diamondFacetAddress;
            s.removeFunction(oldFacetAddress, selector);
        }
    }

    function addFacet(Layout storage s, address facet) internal {
        if (facet != address(this)) {
            require(facet.isContract(), "Diamond: facet has no code");
        }
        s.diamondFacets[facet].position = s.diamondFacetAddresses.length;
        s.diamondFacetAddresses.push(facet);
    }

    function addFunction(
        Layout storage s,
        bytes4 selector,
        uint96 selectorPosition,
        address facet
    ) internal {
        s.functionSelectors[selector].position = selectorPosition;
        s.diamondFacets[facet].functionSelectors.push(selector);
        s.functionSelectors[selector].diamondFacetAddress = facet;
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
        uint256 selectorPosition = s.functionSelectors[selector].position;
        uint256 lastSelectorPosition = s.diamondFacets[facet].functionSelectors.length - 1;
        // if not the same then replace selector with lastSelector
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = s.diamondFacets[facet].functionSelectors[lastSelectorPosition];
            s.diamondFacets[facet].functionSelectors[selectorPosition] = lastSelector;
            s.functionSelectors[lastSelector].position = uint96(selectorPosition);
        }
        // delete the last selector
        s.diamondFacets[facet].functionSelectors.pop();
        delete s.functionSelectors[selector];

        // if no more selectors for facet address then delete the facet address
        if (lastSelectorPosition == 0) {
            // replace facet address with last facet address and delete last facet address
            uint256 lastFacetAddressPosition = s.diamondFacetAddresses.length - 1;
            uint256 facetAddressPosition = s.diamondFacets[facet].position;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = s.diamondFacetAddresses[lastFacetAddressPosition];
                s.diamondFacetAddresses[facetAddressPosition] = lastFacetAddress;
                s.diamondFacets[lastFacetAddress].position = facetAddressPosition;
            }
            s.diamondFacetAddresses.pop();
            delete s.diamondFacets[facet].position;
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

            (bool success, bytes memory returndata) = init_.delegatecall(calldata_);
            if (!success) {
                uint256 returndataLength = returndata.length;
                if (returndataLength != 0) {
                    assembly {
                        revert(add(32, returndata), returndataLength)
                    }
                } else {
                    revert("Diamond: init_ call reverted");
                }
            }
        }
    }

    function facets(Layout storage s) internal view returns (IDiamondLoupe.Facet[] memory facets_) {
        uint256 nbFacets = s.diamondFacetAddresses.length;
        facets_ = new IDiamondLoupe.Facet[](nbFacets);
        for (uint256 i; i < nbFacets; ++i) {
            address facet = s.diamondFacetAddresses[i];
            facets_[i].facetAddress = facet;
            facets_[i].functionSelectors = s.diamondFacets[facet].functionSelectors;
        }
    }

    function facetFunctionSelectors(Layout storage s, address facet) internal view returns (bytes4[] memory) {
        return s.diamondFacets[facet].functionSelectors;
    }

    function facetAddresses(Layout storage s) internal view returns (address[] memory facetAddresses_) {
        return s.diamondFacetAddresses;
    }

    function facetAddress(Layout storage s, bytes4 functionSelector) internal view returns (address facetAddress_) {
        return s.functionSelectors[functionSelector].diamondFacetAddress;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
