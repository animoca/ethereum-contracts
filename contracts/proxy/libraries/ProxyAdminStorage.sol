// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";
import {StorageVersion} from "./StorageVersion.sol";

library ProxyAdminStorage {
    struct Layout {
        address proxyAdmin;
    }

    // bytes32 public constant PROXYADMIN_STORAGE_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    bytes32 public constant PROXYADMIN_STORAGE_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
    bytes32 public constant PROXYADMIN_VERSION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 2);

    event AdminChanged(address previousAdmin, address newAdmin);

    /// @notice Initializes the storage with an initial admin.
    /// @notice Sets the proxy admin storage version to `1`.
    /// @dev Reverts if the proxy admin storage is already initialized to version `1` or above.
    /// @dev Reverts if `initialAdmin` is the zero address.
    /// @dev Emits an {AdminChanged} event.
    /// @param initialAdmin The initial payout wallet.
    function init(Layout storage s, address initialAdmin) internal {
        // assert(PROXYADMIN_STORAGE_SLOT == bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1));
        StorageVersion.setVersion(PROXYADMIN_VERSION_SLOT, 1);
        require(initialAdmin != address(0), "ProxyAdmin: no initial admin");
        s.proxyAdmin = initialAdmin;
        emit AdminChanged(address(0), initialAdmin);
    }

    /// @notice Ensures that an account is the proxy admin.
    /// @dev Reverts if `account` is not the proxy admin.
    /// @param account The account.
    function enforceIsProxyAdmin(Layout storage s, address account) internal view {
        require(account == s.proxyAdmin, "ProxyAdmin: not the admin");
    }

    /// @notice Sets a new proxy admin.
    /// @dev Reverts if `sender` is not the proxy admin.
    /// @dev Emits an {AdminChanged} event if `newAdmin` is different from the current proxy admin.
    /// @param newAdmin The new proxy admin.
    function changeProxyAdmin(
        Layout storage s,
        address sender,
        address newAdmin
    ) internal {
        address previousAdmin = s.proxyAdmin;
        require(sender == previousAdmin, "ProxyAdmin: not the admin");
        if (previousAdmin != newAdmin) {
            s.proxyAdmin = newAdmin;
            emit AdminChanged(previousAdmin, newAdmin);
        }
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = PROXYADMIN_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }
}
