const glob = require('glob');
const merge = require('lodash.merge');

const files = glob.sync(`${__dirname}/*.config.js`);
const configs = files.map((cfg) => require(cfg));

module.exports = merge(...configs);
