// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20Mock} from "./ERC20Mock.sol";
import {ERC20Burnable} from "./../../../token/ERC20/ERC20Burnable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ERC20BurnableMock is ERC20Mock, ERC20Burnable {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        IForwarderRegistry forwarderRegistry
    ) ERC20Mock(tokenName, tokenSymbol, tokenDecimals, forwarderRegistry) {}

    /// @inheritdoc ERC20Mock
    function _msgSender() internal view virtual override(Context, ERC20Mock) returns (address) {
        return ERC20Mock._msgSender();
    }

    /// @inheritdoc ERC20Mock
    function _msgData() internal view virtual override(Context, ERC20Mock) returns (bytes calldata) {
        return ERC20Mock._msgData();
    }
}
