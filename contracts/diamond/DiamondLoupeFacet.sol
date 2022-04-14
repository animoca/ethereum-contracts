// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
pragma experimental ABIEncoderV2;

import {IDiamondLoupe} from "./interfaces/IDiamondLoupe.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {DiamondStorage} from "./libraries/DiamondStorage.sol";
import {InterfaceDetectionStorage} from "./../introspection/libraries/InterfaceDetectionStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title Diamond Loupe (facet version).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract DiamondLoupeFacet is IDiamondLoupe, Context {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using DiamondStorage for DiamondStorage.Layout;

    /// @notice Initialises the storage.
    /// @notice Marks the following ERC165 interfaces as supported: DiamondLoupe.
    /// @dev Reverts if the sender is not the proxy admin.
    function initDiamondLoupeStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IDiamondLoupe).interfaceId, true);
    }

    /// @inheritdoc IDiamondLoupe
    function facets() external view override returns (IDiamondLoupe.Facet[] memory facets_) {
        facets_ = DiamondStorage.layout().facets();
    }

    /// @inheritdoc IDiamondLoupe
    function facetFunctionSelectors(address facet_) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = DiamondStorage.layout().functionSelectors[facet_].functionSelectors;
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        facetAddresses_ = DiamondStorage.layout().facetAddresses;
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddress(bytes4 functionSelector) external view override returns (address facetAddress_) {
        facetAddress_ = DiamondStorage.layout().selectorToFacetAndPosition[functionSelector].facetAddress;
    }
}
