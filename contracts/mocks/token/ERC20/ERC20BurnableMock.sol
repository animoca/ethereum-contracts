// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC20Mock} from "./ERC20Mock.sol";
import {ERC20Burnable} from "./../../../token/ERC20/ERC20Burnable.sol";

contract ERC20BurnableMock is ERC20Mock, ERC20Burnable {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        string memory tokenURI_
    ) ERC20Mock(holders, allocations, name_, symbol_, decimals_, tokenURI_) {}
}
