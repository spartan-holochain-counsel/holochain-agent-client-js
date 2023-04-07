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
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,
    reformat_app_info,
    reformat_cell_id,
    logging,

    // Forwarded from @holochain/serialization
    hashZomeCall,

    // Forwarded from @whi/holochain-websocket
    Connection,

    PromiseTimeout,
    TimeoutError,

    HolochainClientError,
    ConductorError,
    DeserializationError,
    DnaReadError,
    RibosomeError,
    RibosomeDeserializeError,
    ActivateAppError,
    ZomeCallUnauthorizedError,

    MsgPack,

    // Forwarded from @whi/holo-hash
    HoloHash,
    HoloHashTypes,
    AnyDhtHash,

    AgentPubKey,
    EntryHash,
    NetIdHash,
    DhtOpHash,
    ActionHash,
    DnaWasmHash,
    DnaHash,

    Warning,
    HoloHashError,
    NoLeadingUError,
    BadBase64Error,
    BadSizeError,
    BadPrefixError,
    BadChecksumError,
}
```
