// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibInterfaceDetection} from "./../../introspection/libraries/LibInterfaceDetection.sol";
import {ERC165Facet} from "./../../introspection/ERC165Facet.sol";

contract ERC165FacetMock is ERC165Facet {
    function setSupportedInterface(bytes4 interfaceId, bool supported) external {
        LibInterfaceDetection.setSupportedInterface(interfaceId, supported);
    }
}
