const fse = require('fs-extra');
const path = require('path');
const {task} = require('hardhat/config');

require('solidity-coverage');

task('coverage', async (taskArguments, hre, runSuper) => {
  // hre.config.mocha.grep cannot be used because it is overwritten by cli option in hardhart@2.9.0
  // see https://github.com/NomicFoundation/hardhat/issues/2459
  hre.config.mocha.grep = '@skip-on-coverage';
  hre.config.mocha.invert = true;

  const artifacts = hre.config.paths.artifacts;
  const artifactsBackup = `${artifacts}.bak`;
  if (fse.pathExistsSync(artifacts)) {
    fse.moveSync(artifacts, artifactsBackup, {overwrite: true});
  }

  const result = await runSuper(taskArguments);

  // hre.config.path.artifacts was modified during the coverage task
  const coverageArtifacts = path.normalize(path.join(config.paths.root, 'artifacts.coverage'));
  fse.moveSync(artifacts, coverageArtifacts, {overwrite: true});
  if (fse.pathExistsSync(artifactsBackup)) {
    fse.moveSync(artifactsBackup, artifacts, {});
  }

  return result;
});
