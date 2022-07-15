const mergeWith = require('lodash.mergewith');
const glob = require('glob');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

// Deep merges hardhat configuration objects, concatenating array values
function mergeConfigs(...configs) {
  const result = {};
  for (const config of configs) {
    mergeWith(result, config, customizer);
  }
  return result;
}

function mergeConfigFolder(folder) {
  const files = glob.sync(`${folder}/*.config.js`);
  const configs = files.map((cfg) => require(cfg));
  return mergeConfigs(...configs);
}

module.exports = {
  mergeConfigs,
  mergeConfigFolder,
};
