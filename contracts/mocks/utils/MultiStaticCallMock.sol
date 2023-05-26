// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {MultiStaticCall} from "./../../utils/MultiStaticCall.sol";

contract MultiStaticCallMock is MultiStaticCall {
    function getBlockNumber() public view returns (uint256 blockNumber) {
        blockNumber = block.number;
    }

    function getCurrentBlockCoinbase() public view returns (address coinbase) {
        coinbase = block.coinbase;
    }

    function getCurrentBlockGasLimit() public view returns (uint256 gaslimit) {
        gaslimit = block.gaslimit;
    }

    function getCurrentBlockTimestamp() public view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function getEthBalance(address addr) public view returns (uint256 balance) {
        balance = addr.balance;
    }

    function revertingCall() public pure {
        revert("reverted");
    }
}
