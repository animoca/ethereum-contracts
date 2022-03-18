// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";
import {StorageVersion} from "./StorageVersion.sol";

library LibProxyAdmin {
    /**
     * Event emited when the proxy admin changes.
     * @param previousAdmin the previous admin.
     * @param newAdmin the new admin.
     */
    event AdminChanged(address previousAdmin, address newAdmin);

    // bytes32 public constant PROXYADMIN_STORAGE_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    bytes32 public constant PROXYADMIN_STORAGE_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
    bytes32 public constant PROXYADMIN_VERSION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 2);

    function initProxyAdminStorage(address initialAdmin) internal {
        // assert(PROXYADMIN_STORAGE_SLOT == bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1));
        StorageVersion.setVersion(PROXYADMIN_VERSION_SLOT, 1);
        StorageSlot.AddressSlot storage admin = StorageSlot.getAddressSlot(PROXYADMIN_STORAGE_SLOT);
        if (initialAdmin != address(0)) {
            admin.value = initialAdmin;
            emit AdminChanged(address(0), initialAdmin);
        }
    }

    function proxyAdmin() internal view returns (address) {
        return StorageSlot.getAddressSlot(PROXYADMIN_STORAGE_SLOT).value;
    }

    function enforceIsProxyAdmin(address account) internal view {
        require(account == proxyAdmin(), "ProxyAdmin: not the admin");
    }

    function changeProxyAdmin(address newAdmin, address sender) internal {
        StorageSlot.AddressSlot storage admin = StorageSlot.getAddressSlot(PROXYADMIN_STORAGE_SLOT);
        address previousAdmin = admin.value;
        require(sender == previousAdmin, "ProxyAdmin: not the admin");
        if (previousAdmin != newAdmin) {
            admin.value = newAdmin;
            emit AdminChanged(previousAdmin, newAdmin);
        }
    }
}
