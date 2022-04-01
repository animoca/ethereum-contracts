// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {OwnershipStorage} from "./libraries/OwnershipStorage.sol";
import {OwnableBase} from "./OwnableBase.sol";

/// @title ERC173 Contract Ownership Standard (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract OwnableFacet is OwnableBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using OwnershipStorage for OwnershipStorage.Layout;

    /// @notice Initialises the storage with an initial contract owner.
    /// @notice Sets the ownership storage version to 1.
    /// @notice Marks the following ERC165 interfaces as supported: ERC173.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ownership storage is already initialized to version `1` or above.
    /// @dev Emits as {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner the initial contract owner.
    function initOwnershipStorage(address initialOwner) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        OwnershipStorage.layout().init(initialOwner);
    }
}
