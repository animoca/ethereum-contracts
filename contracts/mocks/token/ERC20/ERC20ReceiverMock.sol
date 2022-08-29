// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IERC20Receiver} from "./../../../token/ERC20/interfaces/IERC20Receiver.sol";
import {ERC20Storage} from "./../../../token/ERC20/libraries/ERC20Storage.sol";
import {ERC20Receiver} from "./../../../token/ERC20/ERC20Receiver.sol";

/// @title ERC20 Receiver Mock.
contract ERC20ReceiverMock is ERC20Receiver {
    bool internal immutable _accept;
    address internal immutable _tokenAddress;

    event ERC20Received(address sender, address from, uint256 value, bytes data);

    constructor(bool accept, address tokenAddress) {
        _accept = accept;
        _tokenAddress = tokenAddress;
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
            return ERC20Storage.ERC20_RECEIVED;
        } else {
            return 0x0;
        }
    }
}
