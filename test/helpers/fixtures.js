const {config} = require('hardhat');
const {takeSnapshot} = require('@nomicfoundation/hardhat-network-helpers');

function createFixtureLoader() {
  let snapshots = [];

  if (config.gasReporter !== undefined && config.gasReporter.enabled) {
    return async (fixture, context) => {
      return await fixture.bind(context)();
    };
  }

  return async (fixture, context) => {
    const snapshot = snapshots.find((s) => s.fixture === fixture && s.context === context);
    if (snapshot !== undefined) {
      await snapshot.id.restore();
      snapshot.id = await takeSnapshot();
      return snapshot.data;
    }
    const data = await fixture.bind(context)();
    const id = await takeSnapshot();
    snapshots.push({fixture, data, id, context});
    return data;
  };
}

module.exports = {
  createFixtureLoader,
  loadFixture: createFixtureLoader(),
};
