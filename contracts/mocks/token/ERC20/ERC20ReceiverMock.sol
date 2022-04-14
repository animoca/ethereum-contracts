// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC20Receiver} from "./../../../token/ERC20/interfaces/IERC20Receiver.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC165} from "./../../../introspection/ERC165.sol";

/// @title ERC20 Receiver Mock.
contract ERC20ReceiverMock is IERC20Receiver, ERC165 {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    bool internal immutable _accept;
    address internal immutable _tokenAddress;

    event ERC20Received(address sender, address from, uint256 value, bytes data);

    constructor(bool accept, address tokenAddress) {
        _accept = accept;
        _tokenAddress = tokenAddress;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Receiver).interfaceId, true);
    }

    //==================================================== ERC20Receiver ====================================================//

    /// @inheritdoc IERC20Receiver
    function onERC20Received(
        address sender,
        address from,
        uint256 value,
        bytes memory data
    ) public virtual override returns (bytes4) {
        require(msg.sender == _tokenAddress, "ERC20Receiver: wrong token");
        if (_accept) {
            emit ERC20Received(sender, from, value, data);
            return type(IERC20Receiver).interfaceId;
        } else {
            return 0x0;
        }
    }
}
