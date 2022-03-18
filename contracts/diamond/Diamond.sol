// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCutBase} from "./interfaces/IDiamondCutBase.sol";

/**
 * @title ERC2535 Diamond Standard, Diamond.
 * @dev See https://eips.ethereum.org/EIPS/eip-2535
 */
contract Diamond {
    constructor(IDiamondCutBase.FacetCut[] memory diamondCut_, IDiamondCutBase.Initialization[] memory initializations_) payable {
        LibDiamond.diamondCut(diamondCut_, initializations_);
    }

    fallback() external payable {
        address facet = LibDiamond.facetAddress(msg.sig);
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
