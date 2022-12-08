// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IOperatorFilterRegistry} from "./../../../token/royalty/interfaces/IOperatorFilterRegistry.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721WithOperatorFilterer} from "./../../../token/ERC721/ERC721WithOperatorFilterer.sol";
import {ERC721BatchTransferWithOperatorFilterer} from "./../../../token/ERC721/ERC721BatchTransferWithOperatorFilterer.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../../metatx/ForwarderRegistryContext.sol";

contract ERC721WithOperatorFiltererMock is
    ERC721WithOperatorFilterer,
    ERC721BatchTransferWithOperatorFilterer,
    ERC721Mintable,
    ForwarderRegistryContext
{
    constructor(
        IOperatorFilterRegistry filterRegistry,
        IForwarderRegistry forwarderRegistry
    ) ERC721WithOperatorFilterer(filterRegistry) ContractOwnership(msg.sender) ForwarderRegistryContext(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}
