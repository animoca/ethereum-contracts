// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC1155} from "./../interfaces/IERC1155.sol";
import {IERC1155Mintable} from "./../interfaces/IERC1155Mintable.sol";
import {IERC1155Deliverable} from "./../interfaces/IERC1155Deliverable.sol";
import {IERC1155Burnable} from "./../interfaces/IERC1155Burnable.sol";
import {IERC1155TokenReceiver} from "./../interfaces/IERC1155TokenReceiver.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ProxyInitialization} from "./../../../proxy/libraries/ProxyInitialization.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC1155Storage {
    using Address for address;
    using ERC1155Storage for ERC1155Storage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        mapping(uint256 => mapping(address => uint256)) balances;
        mapping(address => mapping(address => bool)) operators;
    }

    bytes32 internal constant LAYOUT_STORAGE_SLOT = bytes32(uint256(keccak256("animoca.token.ERC1155.ERC1155.storage")) - 1);

    bytes4 internal constant ERC1155_SINGLE_RECEIVED = IERC1155TokenReceiver.onERC1155Received.selector;
    bytes4 internal constant ERC1155_BATCH_RECEIVED = IERC1155TokenReceiver.onERC1155BatchReceived.selector;

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    /// @notice Marks the following ERC165 interface(s) as supported: ERC1155.
    function init() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC1155).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC1155Mintable.
    function initERC1155Mintable() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC1155Mintable).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC1155Deliverable.
    function initERC1155Deliverable() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC1155Deliverable).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC1155Burnable.
    function initERC1155Burnable() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC1155Burnable).interfaceId, true);
    }

    function setApprovalForAll(Layout storage s, address sender, address operator, bool approved) internal {
        require(operator != sender, "ERC1155: self-approval");
        s.operators[sender][operator] = approved;
        emit ApprovalForAll(sender, operator, approved);
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) internal {

        require(to != address(0), "ERC1155: transfer to zero");
        require(_isOperatable(s, from, sender), "ERC1155: non-approved sender");

        _transferToken(s, from, to, id, value);

        emit TransferSingle(sender, from, to, id, value);

        if (to.isContract()) {
            _callOnERC1155Received(sender, from, to, id, value, data);
        }
    }

    function safeBatchTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) internal {
        require(to != address(0), "ERC1155: transfer to zero");
        require(ids.length == values.length, "ERC1155: inconsistent arrays");

        require(_isOperatable(s, from, sender), "ERC1155: non-approved sender");

        for (uint256 i; i != ids.length; ++i) {
            _transferToken(s, from, to, ids[i], values[i]);
        }

        emit TransferBatch(sender, from, to, ids, values);

        if (to.isContract()) {
            _callOnERC1155BatchReceived(sender, from, to, ids, values, data);
        }
    }

    function safeMint(
        Layout storage s,
        address sender,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) internal {
        require(to != address(0), "ERC1155: mint to zero");

        _mintToken(s, to, id, value);

        emit TransferSingle(sender, address(0), to, id, value);

        if (to.isContract()) {
            _callOnERC1155Received(sender, address(0), to, id, value, data);
        }
    }

    function safeBatchMint(
        Layout storage s,
        address sender,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) internal {
        require(to != address(0), "ERC1155: mint to zero");
        require(ids.length == values.length, "ERC1155: inconsistent arrays");

        for (uint256 i; i != ids.length; ++i) {
            _mintToken(s, to, ids[i], values[i]);
        }

        emit TransferBatch(sender, address(0), to, ids, values);

        if (to.isContract()) {
            _callOnERC1155BatchReceived(sender, address(0), to, ids, values, data);
        }
    }

    function burnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256 id,
        uint256 value
    ) internal {
        require(_isOperatable(s, from, sender), "ERC1155: non-approved sender");
        _burnToken(s, from, id, value);
        emit TransferSingle(sender, from, address(0), id, value);
    }

    function batchBurnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values
    ) internal {
        require(ids.length == values.length, "ERC1155: inconsistent arrays");
        require(_isOperatable(s, from, sender), "ERC1155: non-approved sender");

        for (uint256 i; i != ids.length; ++i) {
            _burnToken(s, from, ids[i], values[i]);
        }

        emit TransferBatch(sender, from, address(0), ids, values);
    }

    function balanceOf(Layout storage s, address owner, uint256 id) internal view returns (uint256 balance) {
        require(owner != address(0), "ERC1155: zero address");
        return s.balances[id][owner];
    }

    function balanceOfBatch(Layout storage s, address[] calldata owners, uint256[] calldata ids) internal view returns (uint256[] memory balances) {
        require(owners.length == ids.length, "ERC1155: inconsistent arrays");

        balances = new uint256[](owners.length);

        for (uint256 i = 0; i != owners.length; ++i) {
            balances[i] = s.balanceOf(owners[i], ids[i]);
        }
    }

    function isApprovedForAll(Layout storage s, address tokenOwner, address operator) internal view returns (bool) {
        return s.operators[tokenOwner][operator];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = LAYOUT_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }

    /**
     * Returns whether `sender` is authorised to make a transfer on behalf of `from`.
     * @param from The address to check operatibility upon.
     * @param sender The sender address.
     * @return operatable True if sender is `from` or an operator for `from`, false otherwise.
     */
    function _isOperatable(Layout storage s, address from, address sender) private view returns (bool operatable) {
        return (from == sender) || s.operators[from][sender];
    }

    function _transferToken(
        Layout storage s,
        address from,
        address to,
        uint256 id,
        uint256 value
    ) private {
        require(value != 0, "ERC1155: zero value");
        uint256 fromBalance = s.balances[id][from];
        uint256 newFromBalance = fromBalance - value;
        require(newFromBalance < fromBalance, "ERC1155: not enough balance");
        if (from != to) {
            uint256 toBalance = s.balances[id][to];
            uint256 newToBalance = toBalance + value;
            require(newToBalance > toBalance, "ERC1155: balance overflow");

            s.balances[id][from] = newFromBalance;
            s.balances[id][to] += newToBalance;
        }
    }

    function _mintToken(
        Layout storage s,
        address to,
        uint256 id,
        uint256 value
    ) private {
        require(value != 0, "ERC1155: zero value");
        uint256 balance = s.balances[id][to];
        uint256 newBalance = balance + value;
        require(newBalance > balance, "ERC1155: balance overflow");
        s.balances[id][to] = newBalance;
    }

    function _burnToken(
        Layout storage s,
        address from,
        uint256 id,
        uint256 value
    ) private {
        require(value != 0, "ERC1155: zero value");
        uint256 balance = s.balances[id][from];
        uint256 newBalance = balance - value;
        require(newBalance < balance, "ERC1155: not enough balance");
        s.balances[id][from] = newBalance;
    }

    /// @notice Calls {IERC1155TokenReceiver-onERC1155Received} on a target contract.
    /// @dev Reverts if the call to the target fails, reverts or is rejected.
    /// @param sender The message sender.
    /// @param from Previous token owner.
    /// @param to New token owner.
    /// @param id Identifier of the token transferred.
    /// @param value Value transferred.
    /// @param data Optional data to send along with the receiver contract call.
    function _callOnERC1155Received(
        address sender,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) private {
        require(IERC1155TokenReceiver(to).onERC1155Received(sender, from, id, value, data) == ERC1155_SINGLE_RECEIVED, "ERC1155: transfer rejected");
    }

    /// @notice Calls {IERC1155TokenReceiver-onERC1155BatchReceived} on a target contract.
    /// @dev Reverts if the call to the target fails, reverts or is rejected.
    /// @param sender The message sender.
    /// @param from Previous token owner.
    /// @param to New token owner.
    /// @param ids Identifiers of the tokens transferred.
    /// @param values Values transferred.
    /// @param data Optional data to send along with the receiver contract call.
    function _callOnERC1155BatchReceived(
        address sender,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) private {
        require(
            IERC1155TokenReceiver(to).onERC1155BatchReceived(sender, from, ids, values, data) == ERC1155_BATCH_RECEIVED,
            "ERC1155: transfer rejected"
        );
    }
}
