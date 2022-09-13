// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20SimpleMock} from "./ERC20SimpleMock.sol";
import {ERC20Detailed} from "./../../../token/ERC20/ERC20Detailed.sol";
import {ERC20Metadata} from "./../../../token/ERC20/ERC20Metadata.sol";
import {ERC20Permit} from "./../../../token/ERC20/ERC20Permit.sol";
import {ERC20SafeTransfers} from "./../../../token/ERC20/ERC20SafeTransfers.sol";
import {ERC20BatchTransfers} from "./../../../token/ERC20/ERC20BatchTransfers.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract ERC20Mock is ERC20SimpleMock, ERC20Detailed, ERC20Metadata, ERC20Permit, ERC20SafeTransfers, ERC20BatchTransfers {
    constructor(
        address[] memory holders,
        uint256[] memory allocations,
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        string memory uri,
        IForwarderRegistry forwarderRegistry
    ) ERC20SimpleMock(holders, allocations, forwarderRegistry) ERC20Detailed(tokenName, tokenSymbol, tokenDecimals) ERC20Metadata(uri) {}

    /// @inheritdoc ERC20SimpleMock
    function _msgSender() internal view virtual override(Context, ERC20SimpleMock) returns (address) {
        return ERC20SimpleMock._msgSender();
    }

    /// @inheritdoc ERC20SimpleMock
    function _msgData() internal view virtual override(Context, ERC20SimpleMock) returns (bytes calldata) {
        return ERC20SimpleMock._msgData();
    }
}
