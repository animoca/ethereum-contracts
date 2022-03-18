// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {IDiamondCutBatchInit} from "./interfaces/IDiamondCutBatchInit.sol";
import {LibProxyAdmin} from "./../proxy/libraries/LibProxyAdmin.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";
import {LibInterfaceDetection} from "./../introspection/libraries/LibInterfaceDetection.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Diamond Cut (facet version).
 * @dev Note: This facet depends on {ProxyAdminFacet}.
 */
contract DiamondCutFacet is IDiamondCut, IDiamondCutBatchInit, Context {
    function initDiamondCutStorage() external {
        LibInterfaceDetection.setSupportedInterface(type(IDiamondCut).interfaceId, true);
        LibInterfaceDetection.setSupportedInterface(type(IDiamondCutBatchInit).interfaceId, true);
    }

    /// @inheritdoc IDiamondCut
    function diamondCut(
        FacetCut[] calldata diamondCut_,
        address init_,
        bytes calldata calldata_
    ) external override {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibDiamond.diamondCut(diamondCut_, init_, calldata_);
    }

    /// @inheritdoc IDiamondCutBatchInit
    function diamondCut(FacetCut[] calldata diamondCut_, Initialization[] calldata initializations_) external override {
        LibProxyAdmin.enforceIsProxyAdmin(_msgSender());
        LibDiamond.diamondCut(diamondCut_, initializations_);
    }
}
