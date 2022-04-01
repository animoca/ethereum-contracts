// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {ERC20SimpleMock} from "./ERC20SimpleMock.sol";
import {ERC20Detailed} from "./../../../token/ERC20/ERC20Detailed.sol";
import {ERC20Metadata} from "./../../../token/ERC20/ERC20Metadata.sol";
import {ERC20Permit} from "./../../../token/ERC20/ERC20Permit.sol";
import {ERC20SafeTransfers} from "./../../../token/ERC20/ERC20SafeTransfers.sol";
import {ERC20BatchTransfers} from "./../../../token/ERC20/ERC20BatchTransfers.sol";

contract ERC20Mock is ERC20SimpleMock, ERC20Detailed, ERC20Metadata, ERC20Permit, ERC20SafeTransfers, ERC20BatchTransfers {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        string memory tokenURI_
    ) ERC20SimpleMock(holders, allocations) ERC20Detailed(name_, symbol_, decimals_) ERC20Metadata(tokenURI_) {}
}
