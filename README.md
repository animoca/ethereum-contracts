# Animoca Ethereum Contracts

[![NPM Package](https://img.shields.io/npm/v/@animoca/ethereum-contracts.svg)](https://www.npmjs.org/package/@animoca/ethereum-contracts)
[![Coverage Status](https://codecov.io/gh/animoca/ethereum-contracts/graph/badge.svg)](https://codecov.io/gh/animoca/ethereum-contracts)

Solidity contracts development library which uses [HardHat](https://hardhat.org/) consisting of upgradeable contracts, Hardhat plugins and configurations, tooling and testing utilities.

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

## HardHat plugins and configurations

A set of plugins and configurations are provided to improve the development experience. They can be used in your own project in your `hardhat.config.js`:

```javascript
const merge = require("lodash.merge");

// load all the plugins (you can also load them one by one)
require("@animoca/ethereum-contracts/hardhat-plugins");

// deep merges your config on top of the default provided config
module.exports = merge(require("@animoca/ethereum-contracts/hardhat-config"), {
  // my config
});
```

See the `README.md` of each plugin for more details.

## Constants and test behaviors

Some constants and reusable test behaviors can be used in your own testing code:

```javascript
const { constants, behaviors } = require("@animoca/ethereum-contracts");
const { ZeroAddress, EmptyByte } = constants;
const { shouldSupportInterfaces } = behaviors;

// Your tests
```

Some behaviors, such as some token standards extensively test the whole standard logic. For example, you can test the correct implementation of your ERC20 token contract with the function `behavesLikeERC20`.

## Test helpers

### Fixtures

To speed up tests execution, fixtures based one `evm_snapshot`/`evm_revert` can be used. For example:

```javascript
const { loadFixture } = require("@animoca/ethereum-contracts/test/helpers/fixtures");

describe("MyContract", function () {
  const fixture = async function () {
    // contract(s) initialization
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  // tests
  // ...
});
```

### Diamond

Functions for managing deployment of diamonds and their facets are provided in `test/helpers/diamond.js`.

### Time

Functions for managing the EVM time are provided in `test/helpers/time.js`.

### Execution

A test runner function allows to test some contract logic in immutable setup as well as in diamond setup. The contracts setup in handled via a configuration object, meanwhile the deployment logic is delegated to the tool.

Here is a simple usage example where the same testing logic will be applied to both the immutable version and the facet version of a contract:

```javascript
const { getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests } = require("../../helpers/run");
const { loadFixture } = require("../../helpers/fixtures");

const config = {
  immutable: { name: "MyImmutableContract", ctorArguments: ["myArg", "forwarderRegistry"] },
  diamond: {
    facets: [
      { name: "ProxyAdminFacet", ctorArguments: ["forwarderRegistry"], init: { method: "initProxyAdminStorage", arguments: ["initialAdmin"] } },
      { name: "DiamondCutFacet", ctorArguments: ["forwarderRegistry"], init: { method: "initDiamondCutStorage" } },
      {
        name: "MyFacetContract",
        ctorArguments: ["forwarderRegistry"],
        init: { method: "initMyStorage", arguments: ["myArg"] },
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
  },
};

runBehaviorTests("MyContract", config, function (deployFn) {
  const fixture = async function () {
    this.contract = await deployFn({ myArg: "test" });
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  // tests
  // ...
});
```

More complex examples can be found throughout the existing tests

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
```

Run the tests (parallel mode):

```bash
yarn test-p
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
