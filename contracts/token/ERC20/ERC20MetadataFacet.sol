// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC20MetadataStorage} from "./libraries/ERC20MetadataStorage.sol";
import {ERC20MetadataBase} from "./ERC20MetadataBase.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";
import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";

/// @title ERC20 Fungible Token Standard, optional extension: Metadata (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet} and {InterfaceDetectionFacet}.
contract ERC20MetadataFacet is ERC20MetadataBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC20MetadataStorage for ERC20MetadataStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initialises the storage with an initial token URI.
    /// @notice Sets the ERC20Metadata storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ERC20Metadata storage is already initialized to version `1` or above.
    /// @param uri The token URI.
    function initERC20MetadataStorage(string memory uri) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC20MetadataStorage.layout().init(uri);
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}
