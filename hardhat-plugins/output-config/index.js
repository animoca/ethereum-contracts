const fse = require('fs-extra');
const {extendEnvironment} = require('hardhat/config');

extendEnvironment((hre) => {
  fse.writeFileSync('hardhat.config.last.json', JSON.stringify(hre.config, null, 2));
});
