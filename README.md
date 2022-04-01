# Animoca Ethereum Contracts

[![NPM Package](https://img.shields.io/npm/v/@animoca/ethereum-contracts.svg)](https://www.npmjs.org/package/@animoca/ethereum-contracts)
[![Coverage Status](https://codecov.io/gh/animoca/ethereum-contracts/graph/badge.svg)](https://codecov.io/gh/animoca/ethereum-contracts)

Solidity contracts development library which uses [HardHat](https://hardhat.org/) consisting of upgradeable contracts, Hardhat plugins and configurations, tooling and testing utilities.

## Overview

### Solidity contracts

The contracts are designed to be usable in any setup, behind a proxy or not. To achieve this, every storage is managed via [diamond storage pattern](https://dev.to/mudgen/how-diamond-storage-works-90e).

The contracts are named using the following convention:
| contract                       | description                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `libraries/XXXXStorage.sol`    | Library managing the diamond storage and the core contract logic                      |
| `XXXBase.sol`                  | The base proxiable contract. Should be inherited by a proxied implementation          |
| `XXX.sol`                      | The base immutable contract. Should be inherited by an immutable implementation       |
| `XXXFacet.sol`                 | The facet implementation. Should be deployed and used as a diamon face                |

To use a contract, simply import it in your code, for example:

```solidity
import "@animoca/ethereum-contracts/contracts/access/Ownable.sol";

contract MyContract is Ownable {
  // my code...
}
```

The compiled artifacts are available in the `artifacts` folder.

### HardHat plugins and configurations

A set of plugins and configurations are provided to improve the development experience. They can be used in your own project in your `hardhat.config.js`:

```javascript
const merge = require('lodash.merge');

// load all the plugins (you can also load them one by one)
require('@animoca/ethereum-contracts/hardhat-plugins');

// deep merges your config on top of the default provided config
module.exports = merge(require('./hardhat-config'), {
  // my config
});
```

### Constants and test behaviors

Some constants and reusable test behaviors can be used in your own testing code:

```javascript
const {constants, behaviors} = require("@animoca/ethereum-contracts");
const {ZeroAddress, EmptyByte} = constants;
const {shouldSupportInterfaces} = behaviors;

// Your tests
```

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

Run the full pipeline:

```bash
yarn run-all
```

See `package.json` for additional commands.
