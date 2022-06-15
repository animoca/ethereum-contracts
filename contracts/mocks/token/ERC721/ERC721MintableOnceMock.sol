// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721MintableOnce} from "./../../../token/ERC721/ERC721MintableOnce.sol";
import {ERC721DeliverableOnce} from "./../../../token/ERC721/ERC721DeliverableOnce.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../../metatx/ForwarderRegistryContext.sol";

/// @title ERC721MintableOnceFacetMock
contract ERC721MintableOnceMock is ERC721, ERC721MintableOnce, ERC721DeliverableOnce, ERC721Burnable, ForwarderRegistryContext {
    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContext(forwarderRegistry) ContractOwnership(msg.sender) {}

    /// @dev mock coverage function
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
