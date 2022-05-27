module.exports = process.env.COVERAGE ? {
    paths: {
      artifacts: 'artifacts.coverage',
      cache: 'cache.coverage',
    },
}: {};
