// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibInterfaceDetection} from "./../../introspection/libraries/LibInterfaceDetection.sol";
import {ERC165} from "./../../introspection/ERC165.sol";

contract ERC165Mock is ERC165 {
    function setSupportedInterface(bytes4 interfaceId, bool supported) external {
        LibInterfaceDetection.setSupportedInterface(interfaceId, supported);
    }
}
