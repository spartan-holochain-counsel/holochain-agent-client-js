[back to README.md](README.md)

# Contributing

## Overview
This package is designed to work with Holochain's [App
Interface](https://github.com/holochain/holochain/blob/HEAD/crates/holochain_conductor_api/src/app_interface.rs)
API.


## Development

See [docs/API.md](docs/API.md) for detailed API References

### `logging()`
Turns on debugging logs.

```javascript
import { logging } from '@spartan-hc/holochain-agent-client';

logging(); // show debug logs
```

### Environment

- Developed using Node.js `v18.14.2`
- Enter `nix develop` for development environment dependencies.

### Building
No build is required for Node.

Bundling with Webpack is supported for web
```
npx webpack
```

### Minified Size Breakdown
Sizes are approximate

- base size - 5kb
- `@noble/ed25519` - 5kb
- `@spartan-hc/holo-hash` - 10kb
- `@spartan-hc/holochain-websocket` - 9kb
- `@spartan-hc/holochain-serialization` - 6kb
- `@msgpack/msgpack`
  - `encode` - 10kb
  - `decode` - 14kb

Expected minified size 59kb

### Testing

To run all tests with logging
```
make test-debug
```

- `make test-integration-debug` - **Integration tests only**
- `make test-e2e-debug` - **End-2-end tests only**

> **NOTE:** remove `-debug` to run tests without logging
