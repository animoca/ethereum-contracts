// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Recoverable} from "./../../security/Recoverable.sol";
import {Ownable} from "./../../access/Ownable.sol";

contract RecoverableMock is Recoverable {
    constructor() Ownable(msg.sender) {}
}
