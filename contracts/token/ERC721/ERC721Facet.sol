// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721Base} from "./ERC721Base.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC721 Non-Fungible Token Standard, ERC721 (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet}, {InterfaceDetectionFacet} and {AccessControlFacet}.
contract ERC721Facet is ERC721Base, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC721Storage for ERC721Storage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Marks the following ERC165 interface(s) as supported.
    /// @dev Reverts if the sender is not the proxy admin.
    function initERC721Storage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC721Storage.layout().init();
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
