// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {IERC721Burnable} from "./interfaces/IERC721Burnable.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC721BurnableBase} from "./ERC721BurnableBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Burnable (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet}, {InterfaceDetectionFacet} and {AccessControlFacet}.
contract ERC721BurnableFacet is ERC721BurnableBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Burnable.
    /// @dev Reverts if the sender is not the proxy admin.
    function initERC721BurnableStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Burnable).interfaceId, true);
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
