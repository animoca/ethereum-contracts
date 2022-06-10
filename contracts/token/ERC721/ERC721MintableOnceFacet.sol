// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC721Storage} from "./libraries/ERC721Storage.sol";
import {ERC721MintableOnceBase} from "./ERC721MintableOnceBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

/// @title Custom extension to ERC721: MintableOnce (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet}, {InterfaceDetectionFacet} and {AccessControlFacet}.
contract ERC721MintableOnceFacet is ERC721MintableOnceBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Mintable.
    /// @dev Reverts if the sender is not the proxy admin.
    function initERC721MintableOnceStorage() external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC721Storage.initERC721Mintable();
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
