# Core tests

Run with Node.js 22.18+ / 24+ (built-in TypeScript type stripping):

    node --experimental-strip-types --test visual-engine/tests/*.test.mjs

The tests cover deterministic area-weighted sampling, degenerate/index validation, finite sample buffers, exposure math, interaction transitions, and intact-mesh raycasting. They do not replace browser/WebGL integration or GPU performance tests.
