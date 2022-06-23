// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

/// @title MultiStaticCall - Aggregate results from multiple function static calls
/// @dev Derived from https://github.com/makerdao/multicall (MIT licence)
contract MultiStaticCall {
    struct Call {
        address target;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    function tryAggregate(bool requireSuccess, Call[] calldata calls) public view returns (Result[] memory returnData) {
        uint256 length = calls.length;
        returnData = new Result[](length);
        unchecked {
            for (uint256 i; i != length; ++i) {
                (bool success, bytes memory ret) = calls[i].target.staticcall(calls[i].callData);

                if (requireSuccess) {
                    require(success, "MultiStaticCall: call failed");
                }

                returnData[i] = Result(success, ret);
            }
        }
    }

    function tryBlockAndAggregate(bool requireSuccess, Call[] calldata calls)
        public
        view
        returns (
            uint256 blockNumber,
            bytes32 blockHash,
            Result[] memory returnData
        )
    {
        blockNumber = block.number;
        blockHash = blockhash(block.number);
        returnData = tryAggregate(requireSuccess, calls);
    }

    function getBlockHash(uint256 blockNumber) public view returns (bytes32 blockHash) {
        blockHash = blockhash(blockNumber);
    }

    function getBlockNumber() public view returns (uint256 blockNumber) {
        blockNumber = block.number;
    }

    function getCurrentBlockCoinbase() public view returns (address coinbase) {
        coinbase = block.coinbase;
    }

    function getCurrentBlockDifficulty() public view returns (uint256 difficulty) {
        difficulty = block.difficulty;
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

    function getLastBlockHash() public view returns (bytes32 blockHash) {
        unchecked {
            blockHash = blockhash(block.number - 1);
        }
    }
}
