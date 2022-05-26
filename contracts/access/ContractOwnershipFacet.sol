// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../proxy/libraries/ProxyAdminStorage.sol";
import {ContractOwnershipStorage} from "./libraries/ContractOwnershipStorage.sol";
import {ContractOwnershipBase} from "./ContractOwnershipBase.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC173 Contract Ownership Standard (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract ContractOwnershipFacet is ContractOwnershipBase, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initializes the storage with an initial contract owner.
    /// @notice Sets the ownership storage version to 1.
    /// @notice Marks the following ERC165 interfaces as supported: ERC173.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ownership storage is already initialized to version `1` or above.
    /// @dev Emits as {OwnershipTransferred} if `initialOwner` is not the zero address.
    /// @param initialOwner the initial contract owner.
    function initContractOwnershipStorage(address initialOwner) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ContractOwnershipStorage.layout().proxyInit(initialOwner);
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
