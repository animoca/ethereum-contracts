// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

/**
 * @title ERC2535 Diamond Standard, Diamond Loupe.
 * @dev See https://eips.ethereum.org/EIPS/eip-2535
 * Note: the ERC-165 identifier for this interface is 0x48e2b093
 */
interface IDiamondLoupe {
    struct Facet {
        address facetAddress;
        bytes4[] functionSelectors;
    }

    /// @notice Gets all facet addresses and their four byte function selectors.
    /// @return facets_ Facet
    function facets() external view returns (Facet[] memory facets_);

    /// @notice Gets all the function selectors supported by a specific facet.
    /// @param facet The facet address.
    /// @return facetFunctionSelectors_
    function facetFunctionSelectors(address facet) external view returns (bytes4[] memory facetFunctionSelectors_);

    /// @notice Get all the facet addresses used by a diamond.
    /// @return facetAddresses_
    function facetAddresses() external view returns (address[] memory facetAddresses_);

    /// @notice Gets the facet that supports the given selector.
    /// @dev If facet is not found return address(0).
    /// @param functionSelector The function selector.
    /// @return facetAddress_ The facet address.
    function facetAddress(bytes4 functionSelector) external view returns (address facetAddress_);
}
