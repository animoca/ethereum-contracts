// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {ProxyAdminStorage} from "./../../proxy/libraries/ProxyAdminStorage.sol";
import {ERC20Storage} from "./libraries/ERC20Storage.sol";
import {ERC20Base} from "./ERC20Base.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

/// @title ERC20 Fungible Token Standard (facet version).
/// @dev This contract is to be used as a diamond facet (see ERC2535 Diamond Standard https://eips.ethereum.org/EIPS/eip-2535).
/// @dev Note: This facet depends on {ProxyAdminFacet} and {InterfaceDetectionFacet}.
contract ERC20Facet is ERC20Base, ForwarderRegistryContextBase {
    using ProxyAdminStorage for ProxyAdminStorage.Layout;
    using ERC20Storage for ERC20Storage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContextBase(forwarderRegistry) {}

    /// @notice Initialises the storage with a list of initial allocations.
    /// @notice Sets the ERC20 storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20, ERC20Allowance.
    /// @dev Reverts if the sender is not the proxy admin.
    /// @dev Reverts if the ERC20 storage is already initialized to version `1` or above.
    /// @dev Reverts if `holders` and `allocations` have different lengths.
    /// @dev Reverts if one of `holders` is the zero address.
    /// @dev Reverts if the total supply overflows.
    /// @dev Emits a {Transfer} event for each transfer with `from` set to the zero address.
    /// @param holders The list of accounts to mint the tokens to.
    /// @param allocations The list of amounts of tokens to mint to each of `holders`.
    function initERC20Storage(address[] memory holders, uint256[] memory allocations) external {
        ProxyAdminStorage.layout().enforceIsProxyAdmin(_msgSender());
        ERC20Storage.layout().proxyInit(holders, allocations);
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
