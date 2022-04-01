// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC165} from "./../../introspection/ERC165.sol";

contract ERC165Mock is ERC165 {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    function setSupportedInterface(bytes4 interfaceId, bool supported) external {
        InterfaceDetectionStorage.layout().setSupportedInterface(interfaceId, supported);
    }
}
