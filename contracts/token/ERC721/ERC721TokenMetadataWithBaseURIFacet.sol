// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC721TokenMetadataWithBaseURIStorage} from "./libraries/ERC721TokenMetadataWithBaseURIStorage.sol";
import {ERC721TokenMetadataWithBaseURIBase} from "./ERC721TokenMetadataWithBaseURIBase.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 Non-Fungible Token Standard, optional extension: Metadata (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet}, {OwnableFacet} and {InterfaceDetectionFacet}.
contract ERC721TokenMetadataWithBaseURIFacet is ERC721TokenMetadataWithBaseURIBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC721TokenMetadataWithBaseURIStorage for ERC721TokenMetadataWithBaseURIStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage with a name, symbol and initial token URI.
    /// @notice Sets the ERC721ContractMetadata and ERC721TokenMetadataWithBaseURI storage versions to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Metadata.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ERC721ContractMetadata and ERC721TokenMetadataWithBaseURI storage is already initialized to version `1` or above.
    /// @param tokenName The token name
    /// @param tokenSymbol The token symbol
    /// @param baseMetadataURI The base metadata URI.
    function initERC721MetadataWithBaseURIStorage(
        string memory tokenName,
        string memory tokenSymbol,
        string memory baseMetadataURI
    ) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC721TokenMetadataWithBaseURIStorage.layout().proxyInit(tokenName, tokenSymbol, baseMetadataURI);
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
