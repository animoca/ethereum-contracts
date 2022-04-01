// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AccessControlStorage} from "./../../../access/libraries/AccessControlStorage.sol";
import {ERC20} from "./../../../token/ERC20/ERC20.sol";
import {ERC20Mintable} from "./../../../token/ERC20/ERC20Mintable.sol";
import {Ownable} from "./../../../access/Ownable.sol";

contract ERC20SimpleMock is ERC20, ERC20Mintable {
    constructor(address[] memory holders, uint256[] memory allocations) ERC20(holders, allocations) Ownable(msg.sender) {}
}
