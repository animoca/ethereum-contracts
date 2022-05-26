// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {IDiamondCutBatchInit} from "./interfaces/IDiamondCutBatchInit.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {InterfaceDetectionStorage} from "./../introspection/libraries/InterfaceDetectionStorage.sol";
import {DiamondStorage} from "./libraries/DiamondStorage.sol";
import {ForwarderRegistryContextBase} from "./../metatx/ForwarderRegistryContextBase.sol";

/// @title Diamond Cut (facet version).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract DiamondCutFacet is IDiamondCut, IDiamondCutBatchInit, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using DiamondStorage for DiamondStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage.
    /// @notice Marks the following ERC165 interfaces as supported: DiamondCut, DiamondCutBatchInit.
    /// @dev Reverts if the sender is not the proxy admin.
    function initDiamondCutStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        InterfaceDetectionStorage.Layout storage interfaceDetectionLayout = InterfaceDetectionStorage.layout();
        interfaceDetectionLayout.setSupportedInterface(type(IDiamondCut).interfaceId, true);
        interfaceDetectionLayout.setSupportedInterface(type(IDiamondCutBatchInit).interfaceId, true);
    }

    /// @inheritdoc IDiamondCut
    /// @dev Reverts if the sender is not the proxy admin.
    function diamondCut(
        FacetCut[] calldata cuts,
        address target,
        bytes calldata data
    ) external override {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        DiamondStorage.layout().diamondCut(cuts, target, data);
    }

    /// @inheritdoc IDiamondCutBatchInit
    /// @dev Reverts if the sender is not the proxy admin.
    function diamondCut(FacetCut[] calldata cuts, Initialization[] calldata initializations) external override {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        DiamondStorage.layout().diamondCut(cuts, initializations);
    }
}
