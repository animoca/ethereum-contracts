// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20Mock} from "./ERC20Mock.sol";
import {ERC20Burnable} from "./../../../token/ERC20/ERC20Burnable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/ForwarderRegistryContextBase.sol";

contract ERC20BurnableMock is ERC20Mock, ERC20Burnable {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        string memory tokenURI_,
        IForwarderRegistry forwarderRegistry
    ) ERC20Mock(holders, allocations, name_, symbol_, decimals_, tokenURI_, forwarderRegistry) {}

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ERC20Mock) returns (address) {
        return ERC20Mock._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ERC20Mock) returns (bytes calldata) {
        return ERC20Mock._msgData();
    }
}
