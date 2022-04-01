// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20BatchTransfers} from "./interfaces/IERC20BatchTransfers.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20BatchTransfersBase} from "./ERC20BatchTransfersBase.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Batch Transfers (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract ERC20BatchTransfersFacet is ERC20BatchTransfersBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    /// @notice Marks the following ERC165 interface(s) as supported: ERC20BatchTransfers.
    /// @dev Reverts if the sender is not the proxy admin.
    function initERC20BatchTransfersStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20BatchTransfers).interfaceId, true);
    }
}
