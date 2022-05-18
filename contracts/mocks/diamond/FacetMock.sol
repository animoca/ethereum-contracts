// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

contract FacetMock {
    event FacetFunctionCalled();

    function init() external {
        emit FacetFunctionCalled();
    }

    function revertsWithoutMessage() external pure {
        // solhint-disable-next-line reason-string
        revert();
    }

    function revertsWithMessage() external pure {
        revert("Facet: reverted");
    }
}
