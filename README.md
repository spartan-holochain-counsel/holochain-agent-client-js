[![](https://img.shields.io/npm/v/@whi/holochain-agent-client/latest?style=flat-square)](http://npmjs.com/package/@whi/holochain-agent-client)

# Holochain Agent Client
A Javascript client for communicating with [Holochain](https://holochain.org)'s App Interface API.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/holochain-agent-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-agent-client-js/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/holochain-agent-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-agent-client-js/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/holochain-agent-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-agent-client-js/pulls)


## Overview
This client is guided by the interfaces defined in the
[holochain/holochain](https://github.com/holochain/holochain) project.

### Features

- Get app info
- Create client via app info call
- Call zome function
- Zome call serialization and signing

## Install

```bash
npm i @whi/holochain-agent-client
```

## Basic Usage

Each example assumes this code is present
```javascript
import { AgentClient, AgentPubKey, DnaHash } from '@whi/holochain-agent-client';

const agent_hash = new AgentPubKey("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new DnaHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const app_interface_port = 45678;
```

### Example

```javascript
const client = new AgentClient( agent_hash, {
    "memory": dna_hash,
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with defined zomes

```javascript
const client = new AgentClient( agent_hash, {
    "memory": [ dna_hash, [ "mere_memory" ] ],
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with defined zomes and functions

```javascript
const client = new AgentClient( agent_hash, {
    "memory": [ dna_hash, {
        "mere_memory": [ "save_bytes", "retrieve_bytes" ],
    }],
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```


### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
