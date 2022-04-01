// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Permit} from "./interfaces/IERC20Permit.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC20PermitStorage} from "./libraries/ERC20PermitStorage.sol";
import {ERC20PermitBase} from "./ERC20PermitBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Permit (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract ERC20PermitFacet is ERC20PermitBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;

    /// @notice Initialises the storage.
    /// @notice Sets the ERC20Permit storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Permit.
    /// @dev Reverts if the ERC20Permit storage is already initialized to version `1` or above.
    /// @dev Reverts if the sender is not the proxy admin.
    function initERC20PermitStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC20PermitStorage.init();
    }
}
