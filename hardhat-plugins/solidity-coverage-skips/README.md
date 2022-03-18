# solidity-coverage-skips HardHat plugin

Restores the `artifacts` folder to its previous state after a run of `coverage` with instrumented artifacts.
Skips tests marked with `@skip-on-coverage` while running coverage.

This plugin loads the plugin `solidity-coverage`.
