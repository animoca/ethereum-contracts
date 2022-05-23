// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20} from "./../interfaces/IERC20.sol";
import {IERC20Allowance} from "./../interfaces/IERC20Allowance.sol";
import {IERC20Receiver} from "./../interfaces/IERC20Receiver.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC20Storage {
    using Address for address;
    using ERC20Storage for ERC20Storage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 supply;
    }

    bytes32 public constant ERC20_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20.storage")) - 1);
    bytes32 public constant ERC20_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20.version")) - 1);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @notice Initialises the storage with a list of initial allocations.
    /// @notice Sets the ERC20 storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20, ERC20Allowance.
    /// @dev Reverts if the ERC20 storage is already initialized to version `1` or above.
    /// @dev Reverts if `holders` and `allocations` have different lengths.
    /// @dev Reverts if one of `holders` is the zero address.
    /// @dev Reverts if the total supply overflows.
    /// @dev Emits a {Transfer} event for each transfer with `from` set to the zero address.
    /// @param holders The list of accounts to mint the tokens to.
    /// @param allocations The list of amounts of tokens to mint to each of `holders`.
    function init(
        Layout storage s,
        address[] memory holders,
        uint256[] memory allocations
    ) internal {
        StorageVersion.setVersion(ERC20_VERSION_SLOT, 1);
        s.batchMint(holders, allocations);
        InterfaceDetectionStorage.Layout storage erc165Layout = InterfaceDetectionStorage.layout();
        erc165Layout.setSupportedInterface(type(IERC20).interfaceId, true);
        erc165Layout.setSupportedInterface(type(IERC20Allowance).interfaceId, true);
    }

    function approve(
        Layout storage s,
        address owner,
        address spender,
        uint256 value
    ) internal {
        require(spender != address(0), "ERC20: zero address spender");
        s.allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function decreaseAllowance(
        Layout storage s,
        address owner,
        address spender,
        uint256 subtractedValue
    ) internal {
        require(spender != address(0), "ERC20: zero address spender");
        uint256 allowance_ = s.allowances[owner][spender];

        if (allowance_ != type(uint256).max && subtractedValue != 0) {
            unchecked {
                // save gas when allowance is maximal by not reducing it (see https://github.com/ethereum/EIPs/issues/717)
                uint256 newAllowance = allowance_ - subtractedValue;
                require(newAllowance < allowance_, "ERC20: insufficient allowance");
                s.allowances[owner][spender] = newAllowance;
                allowance_ = newAllowance;
            }
        }
        emit Approval(owner, spender, allowance_);
    }

    function increaseAllowance(
        Layout storage s,
        address owner,
        address spender,
        uint256 addedValue
    ) internal {
        require(spender != address(0), "ERC20: zero address spender");
        uint256 allowance_ = s.allowances[owner][spender];
        if (addedValue != 0) {
            unchecked {
                uint256 newAllowance = allowance_ + addedValue;
                require(newAllowance > allowance_, "ERC20: allowance overflow");
                s.allowances[owner][spender] = newAllowance;
                allowance_ = newAllowance;
            }
        }
        emit Approval(owner, spender, allowance_);
    }

    function transfer(
        Layout storage s,
        address from,
        address to,
        uint256 value
    ) internal {
        require(to != address(0), "ERC20: to zero address");

        if (value != 0) {
            uint256 balance = s.balances[from];
            unchecked {
                uint256 newBalance = balance - value;
                require(newBalance < balance, "ERC20: insufficient balance");
                if (from != to) {
                    s.balances[from] = newBalance;
                    s.balances[to] += value;
                }
            }
        }

        emit Transfer(from, to, value);
    }

    function transferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 value
    ) internal {
        if (from != sender) {
            s.decreaseAllowance(from, sender, value);
        }
        s.transfer(from, to, value);
    }

    //================================================= Batch Transfers ==================================================//

    function batchTransfer(
        Layout storage s,
        address sender,
        address[] memory recipients,
        uint256[] memory values
    ) internal {
        uint256 length = recipients.length;
        require(length == values.length, "ERC20: inconsistent arrays");

        if (length == 0) return;

        uint256 balance = s.balances[sender];

        uint256 totalValue;
        uint256 selfTransferTotalValue;
        for (uint256 i; i != length; ++i) {
            address to = recipients[i];
            require(to != address(0), "ERC20: to zero address");

            uint256 value = values[i];
            if (value != 0) {
                unchecked {
                    uint256 newTotalValue = totalValue + value;
                    require(newTotalValue > totalValue, "ERC20: values overflow");
                    totalValue = newTotalValue;
                    if (sender != to) {
                        s.balances[to] += value;
                    } else {
                        require(value <= balance, "ERC20: insufficient balance");
                        selfTransferTotalValue += value; // cannot overflow as 'selfTransferTotalValue <= totalValue' is always true
                    }
                }
            }
            emit Transfer(sender, to, value);
        }

        if (totalValue != 0 && totalValue != selfTransferTotalValue) {
            unchecked {
                uint256 newBalance = balance - totalValue;
                require(newBalance < balance, "ERC20: insufficient balance"); // balance must be sufficient, including self-transfers
                s.balances[sender] = newBalance + selfTransferTotalValue; // do not deduct self-transfers from the sender balance
            }
        }
    }

    function batchTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address[] memory recipients,
        uint256[] memory values
    ) internal {
        uint256 length = recipients.length;
        require(length == values.length, "ERC20: inconsistent arrays");

        if (length == 0) return;

        uint256 balance = s.balances[from];

        uint256 totalValue;
        uint256 selfTransferTotalValue;
        for (uint256 i; i != length; ++i) {
            address to = recipients[i];
            require(to != address(0), "ERC20: to zero address");

            uint256 value = values[i];

            if (value != 0) {
                unchecked {
                    uint256 newTotalValue = totalValue + value;
                    require(newTotalValue > totalValue, "ERC20: values overflow");
                    totalValue = newTotalValue;
                    if (from != to) {
                        s.balances[to] += value;
                    } else {
                        require(value <= balance, "ERC20: insufficient balance");
                        selfTransferTotalValue += value; // cannot overflow as 'selfTransferTotalValue <= totalValue' is always true
                    }
                }
            }

            emit Transfer(from, to, value);
        }

        if (totalValue != 0 && totalValue != selfTransferTotalValue) {
            unchecked {
                uint256 newBalance = balance - totalValue;
                require(newBalance < balance, "ERC20: insufficient balance"); // balance must be sufficient, including self-transfers
                s.balances[from] = newBalance + selfTransferTotalValue; // do not deduct self-transfers from the sender balance
            }
        }

        if (from != sender) {
            s.decreaseAllowance(from, sender, totalValue);
        }
    }

    //================================================= Safe Transfers ==================================================//

    function safeTransfer(
        Layout storage s,
        address sender,
        address to,
        uint256 value,
        bytes calldata data
    ) internal {
        s.transfer(sender, to, value);
        if (to.isContract()) {
            require(IERC20Receiver(to).onERC20Received(sender, sender, value, data) == type(IERC20Receiver).interfaceId, "ERC20: transfer refused");
        }
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 value,
        bytes calldata data
    ) internal {
        s.transferFrom(sender, from, to, value);
        if (to.isContract()) {
            require(IERC20Receiver(to).onERC20Received(sender, from, value, data) == type(IERC20Receiver).interfaceId, "ERC20: transfer refused");
        }
    }

    function mint(
        Layout storage s,
        address to,
        uint256 value
    ) internal {
        require(to != address(0), "ERC20: mint to zero");
        if (value != 0) {
            uint256 supply = s.supply;
            unchecked {
                uint256 newSupply = supply + value;
                require(newSupply > supply, "ERC20: supply overflow");
                s.supply = newSupply;
                s.balances[to] += value; // balance cannot overflow if supply does not
            }
        }
        emit Transfer(address(0), to, value);
    }

    function batchMint(
        Layout storage s,
        address[] memory recipients,
        uint256[] memory values
    ) internal {
        uint256 length = recipients.length;
        require(length == values.length, "ERC20: inconsistent arrays");

        if (length == 0) return;

        uint256 totalValue;
        for (uint256 i; i != length; ++i) {
            address to = recipients[i];
            require(to != address(0), "ERC20: mint to zero");

            uint256 value = values[i];
            if (value != 0) {
                unchecked {
                    uint256 newTotalValue = totalValue + value;
                    require(newTotalValue > totalValue, "ERC20: values overflow");
                    totalValue = newTotalValue;
                    s.balances[to] += value; // balance cannot overflow if supply does not
                }
            }
            emit Transfer(address(0), to, value);
        }

        if (totalValue != 0) {
            uint256 supply = s.supply;
            unchecked {
                uint256 newSupply = supply + totalValue;
                require(newSupply > supply, "ERC20: supply overflow");
                s.supply = newSupply;
            }
        }
    }

    function burn(
        Layout storage s,
        address from,
        uint256 value
    ) internal {
        if (value != 0) {
            uint256 balance = s.balances[from];
            unchecked {
                uint256 newBalance = balance - value;
                require(newBalance < balance, "ERC20: insufficient balance");
                s.balances[from] = newBalance;
                s.supply -= value; // will not underflow if balance does not
            }
        }

        emit Transfer(from, address(0), value);
    }

    function burnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256 value
    ) internal {
        if (from != sender) {
            s.decreaseAllowance(from, sender, value);
        }
        s.burn(from, value);
    }

    function batchBurnFrom(
        Layout storage s,
        address sender,
        address[] memory owners,
        uint256[] memory values
    ) internal {
        uint256 length = owners.length;
        require(length == values.length, "ERC20: inconsistent arrays");

        if (length == 0) return;

        uint256 totalValue;
        for (uint256 i; i != length; ++i) {
            address from = owners[i];
            uint256 value = values[i];

            if (from != sender) {
                s.decreaseAllowance(from, sender, value);
            }

            if (value != 0) {
                uint256 balance = s.balances[from];
                unchecked {
                    uint256 newBalance = balance - value;
                    require(newBalance < balance, "ERC20: insufficient balance");
                    s.balances[from] = newBalance;
                    totalValue += value; // totalValue cannot overflow if the individual balances do not underflow
                }
            }

            emit Transfer(from, address(0), value);
        }

        if (totalValue != 0) {
            unchecked {
                s.supply -= totalValue; // _totalSupply cannot underfow as balances do not underflow
            }
        }
    }

    function totalSupply(Layout storage s) internal view returns (uint256) {
        return s.supply;
    }

    function balanceOf(Layout storage s, address account) internal view returns (uint256) {
        return s.balances[account];
    }

    function allowance(
        Layout storage s,
        address owner,
        address spender
    ) internal view returns (uint256) {
        return s.allowances[owner][spender];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
