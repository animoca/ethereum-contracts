// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
pragma experimental ABIEncoderV2;

import {IDiamondCutBase} from "./interfaces/IDiamondCutBase.sol";
import {DiamondStorage} from "./libraries/DiamondStorage.sol";

/// @title ERC2535 Diamond Standard, Diamond.
/// @dev See https://eips.ethereum.org/EIPS/eip-2535
contract Diamond {
    using DiamondStorage for DiamondStorage.Layout;

    /// @notice Add/replace/remove facet functions and execute a batch of functions with delegatecall.
    /// @dev Emits a {DiamondCut} event.
    /// @param cuts The list of facet addresses, actions and function selectors to apply to the diamond.
    /// @param initializations The list of addresses and encoded function calls to execute with delegatecall.
    constructor(IDiamondCutBase.FacetCut[] memory cuts, IDiamondCutBase.Initialization[] memory initializations) payable {
        DiamondStorage.layout().diamondCut(cuts, initializations);
    }

    fallback() external payable {
        bytes32 position = DiamondStorage.DIAMOND_STORAGE_POSITION;
        DiamondStorage.Layout storage s;
        assembly {
            s.slot := position
        }
        address facet = s.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: function not found");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
