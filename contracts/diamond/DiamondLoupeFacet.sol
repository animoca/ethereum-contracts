// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IDiamondLoupe} from "./interfaces/IDiamondLoupe.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";
import {LibInterfaceDetection} from "./../introspection/libraries/LibInterfaceDetection.sol";

/**
 * @title Diamond Loupe (facet version).
 * @dev Note: This facet depends on {ProxyAdminFacet}.
 */
contract DiamondLoupeFacet is IDiamondLoupe {
    function initDiamondLoupeStorage() external {
        LibInterfaceDetection.setSupportedInterface(type(IDiamondLoupe).interfaceId, true);
    }

    /// @inheritdoc IDiamondLoupe
    function facets() external view override returns (IDiamondLoupe.Facet[] memory facets_) {
        facets_ = LibDiamond.facets();
    }

    /// @inheritdoc IDiamondLoupe
    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = LibDiamond.facetFunctionSelectors(_facet);
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        facetAddresses_ = LibDiamond.facetAddresses();
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddress(bytes4 functionSelector) external view override returns (address facetAddress_) {
        facetAddress_ = LibDiamond.facetAddress(functionSelector);
    }
}
