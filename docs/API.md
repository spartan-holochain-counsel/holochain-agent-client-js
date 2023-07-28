[back to README.md](../README.md)


# API Reference

## [`new AgentClient( ... )`](./API_AgentClient.md)
A class for communicating with Conductor's App interface with a specific Agent.


## [`new AppSchema( ... )`](./API_AppSchema.md)
A class for defining an App's DNA architecture.


## [`new DnaSchema( ... )`](./API_DnaSchema.md)
A class for defining a DNA's zome architecture.


## [`new ZomeApi( ... )`](./API_ZomeApi.md)
A class for defining and calling a Zome's API interface.



## Module exports
```javascript
{
    // Classes
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    // Functions
    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @holochain/serialization
    hashZomeCall,

    // Forwarded from @spartan-hc/holo-hash
    HoloHashes,

    // Forwarded from @spartan-hc/holochain-websocket
    HolochainWebsocket,
}
```
