const {config, network} = require('hardhat');

function createFixtureLoader() {
  let snapshots = [];

  if (network.name === 'coverage' || config.gasReporter.enabled) {
    return async (fixture, context) => {
      return await fixture.bind(context)();
    };
  }

  return async (fixture, context) => {
    const snapshot = snapshots.find((s) => s.fixture === fixture && s.context === context);
    if (snapshot !== undefined) {
      await network.provider.send('evm_revert', [snapshot.id]);
      const id = await network.provider.send('evm_snapshot', []);
      snapshot.id = id;
      return snapshot.data;
    }
    const data = await fixture.bind(context)();
    const id = await network.provider.send('evm_snapshot', []);
    snapshots.push({fixture, data, id, context});
    return data;
  };
}

module.exports = {
  createFixtureLoader,
};
