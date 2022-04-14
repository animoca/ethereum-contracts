// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {Ownable} from "./../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

contract AccessControlMock is AccessControl, ForwarderRegistryContextBase {
    using AccessControlStorage for AccessControlStorage.Layout;

    bytes32 public constant TEST_ROLE = "tester";

    constructor(IForwarderRegistry forwarderRegistry) Ownable(msg.sender) ForwarderRegistryContextBase(forwarderRegistry) {}

    function enforceHasRole(bytes32 role, address account) external view {
        AccessControlStorage.layout().enforceHasRole(role, account);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
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
