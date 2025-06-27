# Animoca Ethereum Contracts

[![NPM Package](https://img.shields.io/npm/v/@animoca/ethereum-contracts.svg)](https://www.npmjs.org/package/@animoca/ethereum-contracts)
[![Coverage Status](https://codecov.io/gh/animoca/ethereum-contracts/graph/badge.svg)](https://codecov.io/gh/animoca/ethereum-contracts)

Solidity contracts development library which uses [HardHat](https://hardhat.org/) consisting of upgradeable contracts, Hardhat plugins and configurations, tooling and testing utilities.

## Audits

| Date       | Scope                                                                                                                                                 | Commit                                                                                                                                  | Package version                                                            | Auditor                                | Report                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 26/09/2022 | Full library                                                                                                                                          | [05666c7112a5637b9ec13b6883cb626982062244](https://github.com/animoca/ethereum-contracts/tree/05666c7112a5637b9ec13b6883cb626982062244) | [0.2.0](https://www.npmjs.com/package/@animoca/ethereum-contracts/v/0.2.0) | [Solidified](https://solidified.io)    | [link](/audit/Audit%20Report%20-%20Animoca%20Core%20Library%20%5B26.09.2022%5D-final.pdf)               |
| 14/11/2022 | metatx/\*, token/ERC20/\*                                                                                                                             | [4b4cf4535be8367ef67b2827b32ea48a2d70e79c](https://github.com/animoca/ethereum-contracts/tree/4b4cf4535be8367ef67b2827b32ea48a2d70e79c) | [0.3.0](https://www.npmjs.com/package/@animoca/ethereum-contracts/v/0.3.0) | [Halborn](https://https://halborn.com) | [link](/audit/Animoca_Brands_MetaTX_ERC20_Token_Smart_Contract_Security_Audit_Report_Halborn_Final.pdf) |
| 28/06/2023 | token/ERC20/preset/\*, payment/CumulativeMerkleClaim.sol                                                                                              | [c813045b79473a100e8005c7f1ce6ae340f7d235](https://github.com/animoca/ethereum-contracts/tree/c813045b79473a100e8005c7f1ce6ae340f7d235) | [2.0.0](https://www.npmjs.com/package/@animoca/ethereum-contracts/v/2.0.0) | [Solidified](https://solidified.io)    | [link](/audit/Audit%20Report%20-%20Animoca%20Core%20Library%20V2%20%5B28.06.2023%5D-final.pdf)          |
| 18/10/2023 | token/ERC721/preset/\*, token/ERC721/\*\*/ERC721Metadata\*.so;l, token/ERC1155/preset/\*, token/ERC1155/\*\*/ERC1155Metadata\*.sol, token/metadata/\* | [fa9ca10004562eed33e9ac1ed316a2d8342b1c02](https://github.com/animoca/ethereum-contracts/tree/fa9ca10004562eed33e9ac1ed316a2d8342b1c02) | [3.0.0](https://www.npmjs.com/package/@animoca/ethereum-contracts/v/3.0.0) | [Solidified](https://solidified.io)    | [link](/audit/Audit%20Report%20-%20Animoca%20Core%20Library%20Extension%20%5B18.10.2023%5D-final.pdf)   |
| 24/06/2025 | staking/linear/\* | [c7867f97176404bbbe138bda13ec6ac48a7c9c98](https://github.com/animoca/ethereum-contracts/tree/c7867f97176404bbbe138bda13ec6ac48a7c9c98) | [4.2.2](https://www.npmjs.com/package/@animoca/ethereum-contracts/v/4.2.2) | [Oak Security](https://www.oaksecurity.io)    | [link](/audit/2025-06-24%20Audit%20Report%20-%20Animoca%20Staking%20Pool%20v1.2.pdf)   |

## Solidity contracts

### Design

The contracts are designed to be usable in any setup, behind a proxy or not. To achieve this, every storage is managed via [diamond storage pattern](https://dev.to/mudgen/how-diamond-storage-works-90e).

The solidity files are structured as follow:

- `libraries/XYZStorage.sol`: Library managing the diamond storage and the core contract logic.  
  Does not deal with access control and sender-related logic (such as for meta-transactions).
- `base/XYZBase.sol`: Base abstract proxiable contract. Should be inherited by a proxied contract implementation.  
  Deals with access control and sender-related logic. Does not deal with initialization sequence.
- `facets/XYZFacet.sol`: Deployable diamond facet. Should be deployed and used via a diamond proxy.  
  Deals with access control and sender-related logic. Provides the initialization sequence via an initialization function.
- `XYZ.sol`: Abstract immutable contract. Should be inherited by an immutable contract implementation.  
  Deals with access control and sender-related logic. Provides the initialization sequence via its `constructor`.

To use a contract, simply import it in your code, for example:

```solidity
import "@animoca/ethereum-contracts/contracts/access/ContractOwnership.sol";

contract MyContract is ContractOwnership {
  // my code...
}
```

The compiled artifacts are available in the `artifacts` folder.

### Meta-transactions

All the contracts in this library support ERC2771-style meta-transactions.

Meta-transactions can be enabled through the use of the `ForwarderRegistry`. The `ForwarderRegistry` allows users to define which ERC2771 meta-transaction forwarders are authorized to be used for their specific wallet. Enabling the registry mechanism in a contract can be achieved by inheriting `ForwarderRegistryContext` (for a stand-alone contract) or `ForwarderRegistryContextBase` (for a diamond facet). All the deployable contracts in this library are `ForwarderRegistryContext`-enabled.

As a user, There are two ways to approve/revoke a meta-transaction forwarder:

- Direct way: the wallet directly calls `approveForwarder(address forwarder, bool approved)`.
- Forwarded way: the wallet signs an EIP712 `ApproveForwarder(address forwarder,bool approved,uint256 nonce)` message for the forwarder, then the forwarder calls `approveForwarder(bool approved, bytes signature, SignatureType signatureType)`.
- Approve and Forward way: see below.

Forwarding an EIP-2771 meta-transaction can be done in a few different ways:

- Direct forwarding: after the forwarder has been approved, it can directly call the target contract.
- `ForwarderRegistry` forwarding: The `ForwarderRegistry` can also be used to forward the meta-transactions:
  1. after a forwarder has been approved, it can call `forward(address target, bytes data)` on the `ForwarderRegistry`.
  2. without being approved, but with an EIP712 `ApproveForwarder(address forwarder,bool approved,uint256 nonce)` message signed by the user, a forwarder can call `approveAndForward(bytes signature, SignatureType signatureType, address target, bytes data)` on the `ForwarderRegistry`. This will approve the forwarder and then forward the meta-transaction to the target contract. This method is a shortcut enabling meta-transactions usage from the first user transaction.

## Compilation artifacts

The compilation artifacts, including the debug information, are available in the `artifacts` folder, both in the git repository and the release packages. These artifacts can be imported in dependents projects and used in tests or migration scripts with the following hardhat configuration:

```javascript
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@animoca/ethereum-contracts/artifacts',
      },
    ],
  },
```

## Test behaviors

Some behaviors, such as some token standards extensively test the whole standard logic. For example, you can test the correct implementation of your ERC20 token contract with the function `behavesLikeERC20`.

## Installation

To install the module in your project, add it as an npm dependency:

```bash
yarn add -D @animoca/ethereum-contracts hardhat
```

or

```bash
npm add --save-dev @animoca/ethereum-contracts hardhat
```

## Development

Install the dependencies:

```bash
yarn
```

Compile the contracts:

```bash
yarn compile
```

Run the tests:

```bash
yarn test
# or
yarn test-p # parallel mode
```

Run the coverage tests:

```bash
yarn coverage
```

Run the full pipeline (should be run before commiting code):

```bash
yarn run-all
```

See `package.json` for additional commands.

Note: this repository uses git lfs: the module should be installed before pushing changes.
