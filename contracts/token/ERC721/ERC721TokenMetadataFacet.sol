// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC721TokenMetadataStorage} from "./libraries/ERC721TokenMetadataStorage.sol";
import {ERC721TokenMetadataBase} from "./ERC721TokenMetadataBase.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet} and {InterfaceDetectionFacet}.
contract ERC721TokenMetadataFacet is ERC721TokenMetadataBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC721TokenMetadataStorage for ERC721TokenMetadataStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage.
    /// @notice Sets the ERC721ContractMetadata storage version to `1`.
    /// @notice Sets the ERC721TokenMetadata storage version to `1`.
    /// @notice Marks the following ERC165 interfaces as supported: ERC721Metadata.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ERC721ContractMetadata storage is already initialized to version `1` or above.
    /// @dev Reverts if the ERC721TokenMetadata storage is already initialized to version `1` or above.
    /// @param tokenName The token name.
    /// @param tokenSymbol The token symbol.
    function initERC721MetadataStorage(string memory tokenName, string memory tokenSymbol) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC721TokenMetadataStorage.proxyInit(tokenName, tokenSymbol);
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
