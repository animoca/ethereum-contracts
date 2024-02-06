// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IForwarderRegistry} from "./../../../../metatx/interfaces/IForwarderRegistry.sol";
import {ITokenMetadataResolver} from "./../../../metadata/interfaces/ITokenMetadataResolver.sol";
import {ERC1155Storage} from "./../../libraries/ERC1155Storage.sol";
import {ERC2981Storage} from "./../../../royalty/libraries/ERC2981Storage.sol";
import {TokenMetadataStorage} from "./../../../metadata/libraries/TokenMetadataStorage.sol";
import {ContractOwnershipStorage} from "./../../../../access/libraries/ContractOwnershipStorage.sol";
import {ERC1155Base} from "./../../base/ERC1155Base.sol";
import {ERC1155MetadataBase} from "./../../base/ERC1155MetadataBase.sol";
import {ERC1155MintableBase} from "./../../base/ERC1155MintableBase.sol";
import {ERC1155DeliverableBase} from "./../../base/ERC1155DeliverableBase.sol";
import {ERC1155BurnableBase} from "./../../base/ERC1155BurnableBase.sol";
import {ERC2981Base} from "./../../../royalty/base/ERC2981Base.sol";
import {ContractOwnershipBase} from "./../../../../access/base/ContractOwnershipBase.sol";
import {AccessControlBase} from "./../../../../access/base/AccessControlBase.sol";
import {TokenRecoveryBase} from "./../../../../security/base/TokenRecoveryBase.sol";
import {InterfaceDetection} from "./../../../../introspection/InterfaceDetection.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../../../metatx/ForwarderRegistryContext.sol";

contract ERC1155FullBurnProxied is
    ERC1155Base,
    ERC1155MetadataBase,
    ERC1155MintableBase,
    ERC1155DeliverableBase,
    ERC1155BurnableBase,
    ERC2981Base,
    ContractOwnershipBase,
    AccessControlBase,
    TokenRecoveryBase,
    InterfaceDetection,
    ForwarderRegistryContext
{
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;
    using TokenMetadataStorage for TokenMetadataStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ForwarderRegistryContext(forwarderRegistry) {}

    function init(string calldata tokenName, string calldata tokenSymbol, ITokenMetadataResolver metadataResolver) external {
        ContractOwnershipStorage.layout().proxyInit(_msgSender());
        ERC1155Storage.init();
        ERC1155Storage.initERC1155MetadataURI();
        ERC1155Storage.initERC1155Mintable();
        ERC1155Storage.initERC1155Deliverable();
        ERC1155Storage.initERC1155Burnable();
        ERC2981Storage.init();
        TokenMetadataStorage.layout().proxyInit(tokenName, tokenSymbol, metadataResolver);
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
