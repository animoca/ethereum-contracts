const fse = require('fs-extra');
const cloneDeep = require('lodash.clonedeep');
const {extendEnvironment} = require('hardhat/config');

extendEnvironment((hre) => {
  const config = cloneDeep(hre.config);
  for (const networkName of Object.keys(config.networks)) {
    const network = config.networks[networkName];
    if (network.live) {
      delete network.accounts;
    }
  }
  fse.writeFileSync(
    'hardhat.config.last.json',
    JSON.stringify(config, (_, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
  );
});
