// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {PauseStorage} from "./../../lifecycle/libraries/PauseStorage.sol";
import {Pausable} from "./../../lifecycle/Pausable.sol";
import {Ownable} from "./../../access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/ForwarderRegistryContextBase.sol";

contract PausableMock is Pausable, ForwarderRegistryContextBase {
    using PauseStorage for PauseStorage.Layout;

    constructor(bool isPaused, IForwarderRegistry forwarderRegistry)
        Pausable(isPaused)
        Ownable(msg.sender)
        ForwarderRegistryContextBase(forwarderRegistry)
    {}

    function enforceIsPaused() external view {
        PauseStorage.layout().enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        PauseStorage.layout().enforceIsNotPaused();
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
