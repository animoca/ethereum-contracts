// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC20DetailedStorage} from "./libraries/ERC20DetailedStorage.sol";
import {ERC20DetailedBase} from "./ERC20DetailedBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Detailed (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract ERC20DetailedFacet is ERC20DetailedBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC20DetailedStorage for ERC20DetailedStorage.Layout;

    /// @notice Initialises the storage with the token details.
    /// @notice Sets the ERC20Detailed storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Detailed.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ERC20Detailed storage is already initialized to version `1` or above.
    /// @param name_ The token name.
    /// @param symbol_ The token symbol.
    /// @param decimals_ The token decimals.
    function initERC20DetailedStorage(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC20DetailedStorage.layout().init(name_, symbol_, decimals_);
    }
}
