
import * as ed				from '@noble/ed25519';
import {
    AgentPubKey,
}					from '@whi/holo-hash';
import {
    Connection,
}					from '@whi/holochain-websocket';

import { hashZomeCall }			from '@whi/holochain-serialization';
import { log,
	 sha512,
	 hash_secret,
	 reformat_app_info,
	 reformat_cell_id,
	 set_tostringtag }		from './utils.js';
import { AppSchema, DnaSchema }		from './schemas.js';
import { ZomeApi }			from './zome_api.js';

import HoloHashes			from '@whi/holo-hash';
import HolochainWebsocket		from '@whi/holochain-websocket';

export {
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
};


const DEFAULT_AGENT_CLIENT_OPTIONS	= {
    "capability_agent": null,
    "cap_secret": null,
    "signing_handler": zome_call_request => zome_call_request,
};

export class AgentClient {

    static async appInfo ( app_id, connection, timeout ) {
	const conn			= new Connection( connection );

	log.debug && log("Opening connection '%s' for AgentClient", conn.name );
	await conn.open();

	try {
	    const app_info		= await conn.request("app_info", {
		"installed_app_id": app_id,
	    }, timeout );

	    if ( app_info === null )
		throw new Error(`App ID '${APP_ID}' is not running`);

	    return await reformat_app_info( app_info );
	} finally {
	    // Only close the connection if it was created in this block
	    if ( connection !== conn )
		await conn.close( timeout );
	}
    }

    static async createFromAppInfo ( app_id, connection, timeout, options = {} ) {
	const app_schema		= {};
	const app_info			= await AgentClient.appInfo( app_id, connection )

	let agent;

	for ( let [role_name, info] of Object.entries( app_info.roles ) ) {
	    if ( agent === undefined )
		agent			= info.cell_id[1];

	    app_schema[ role_name ]	= info.cell_id[0];
	}

	log.debug && log("Creating AgentClient from app info for '%s' (%s): %s ", app_id, agent, Object.keys(app_schema).join(", ") );
	return new AgentClient( agent, app_schema, connection, options );
    }

    constructor ( agent, app_schema, connection, options = {} ) {
	const opts			= Object.assign({}, DEFAULT_AGENT_CLIENT_OPTIONS, options );

	this._cap_secret		= null;
	this._app_schema		= app_schema instanceof AppSchema
	    ? app_schema
	    : new AppSchema( app_schema );
	this._conn_load			= new Promise(async (f,r) => {
	    this._conn			= new Connection( connection );
	    f();
	});
	this._options			= opts;

	if ( this._options.capability_agent === null ) {
	    this._setup			= this.setupCapabilityAgent()
		.catch( console.error );
	}
	else if ( typeof this._options.signing_handler !== "function" )
	    log.debug && log("WARN: agent (%s) was supplied for AgentClient without a signing handler", this._options.capability_agent );
	else
	    this._setup			= Promise.resolve();

	this.cellAgent( agent );

	this.pre_processors		= [];
	this.post_processors		= [];
    }

    async setupCapabilityAgent () {
	const secretKey		= ed.utils.randomPrivateKey();
	const publicKey		= await ed.getPublicKeyAsync( secretKey );
	const key_pair		= {
	    secretKey,
	    publicKey,
	};

	await this.setCapabilityAgent(
	    new AgentPubKey( key_pair.publicKey ),
	    async ( zome_call_request ) => {
		const zome_call_hash		= await hashZomeCall( zome_call_request );

		zome_call_request.signature	= await ed.signAsync( zome_call_hash, key_pair.secretKey );

		return zome_call_request;
	    },
	    this._options.cap_secret,
	);
    }

    async connection () {
	await this._conn_load;
	await this._setup;
	return this._conn;
    }

    async appInfo ( app_id ) {
	const conn			= await this.connection();
	return await AgentClient.appInfo( app_id, conn, this._options.timeout );
    }

    cellAgent ( agent ) {
	if ( agent !== undefined )
	    this._cell_agent		= new AgentPubKey( agent );

	if ( !(this._cell_agent instanceof Uint8Array) )
	    throw new TypeError(`Invalid Cell Agent '${typeof this._cell_agent}'; should be an Uint8Array`);

	return this._cell_agent;
    }

    capabilityAgent ( agent ) {
	if ( agent !== undefined )
	    this._capability_agent	= new AgentPubKey( agent );

	if ( !(this._capability_agent instanceof Uint8Array) )
	    throw new TypeError(`Invalid Capability Agent '${typeof this._capability_agent}'; should be an Uint8Array`);

	return this._capability_agent;
    }

    setSigningHandler ( signing_handler ) {
	this.capabilityAgent( this._cell_agent );
	this.signing_handler		= signing_handler;
    }

    async setCapabilityAgent ( agent_hash, signing_handler, secret ) {
	this.capabilityAgent( agent_hash );
	this.signing_handler		= signing_handler;

	if ( typeof secret === "string" )
	    secret			= await hash_secret( secret );

	this._cap_secret		= secret;
    }

    addProcessor ( event, callback ) {
	if ( event === "input" )
	    this.pre_processors.push( callback );
	else if ( event === "output" )
	    this.post_processors.push( callback );
	else
	    throw new Error(`Unknown processor event '${event}'; expected 'input' or 'output'`);
    }

    async _run_processors ( event, value, ctx ) {
	let processors;
	if ( event === "input" )
	    processors			= this.pre_processors;
	else if ( event === "output" )
	    processors			= this.post_processors;
	else
	    throw new Error(`Unknown processor event '${event}'; expected 'input' or 'output'`);

	for ( let fn of processors ) {
	    value			= await fn.call( ctx, value, ctx );
	}

	return value;
    }

    async call ( dna_role_name, zome, func, payload, timeout ) {
	const conn			= await this.connection();

	if ( conn._opened === false ) {
	    log.debug && log("Opening connection '%s' for AgentClient", conn.name );
	    await conn.open();
	}

	const req_ctx			= {
	    "start": new Date(),
	    "end": null,
	    "dna": dna_role_name,
	    "zome": zome,
	    "func": func,
	    "input": payload,
	    "timeout": timeout,
	    duration () {
		return ( req_ctx.end || new Date() ) - req_ctx.start;
	    },
	};

	let dna_schema			= this._app_schema.dna( dna_role_name );
	let zome_api			= dna_schema.zome( zome );

	payload				= await this._run_processors( "input", payload, req_ctx );

	let result			= await zome_api.call(
	    conn,
	    this.capabilityAgent(),
	    this.cellAgent(),
	    dna_schema.hash(),
	    func,
	    payload,
	    this.signing_handler,
	    this._cap_secret,
	    timeout || this._options.timeout,
	);

	result				= await this._run_processors( "output", result, req_ctx );

	req_ctx.end			= new Date();

	return result;
    }

    async _request ( ...args ) {
	const conn			= await this.connection();
	if ( conn._opened === false ) {
	    log.debug && log("Opening connection '%s' for AdminClient", conn.name );
	    await conn.open();
	}

	return await conn.request( ...args );
    }

    // Even if no properties change, the Conductor will generate a network seed so that it does not
    // conflict with the Cell being cloned.
    async createCloneCell ( app_id, role_name, modifiers, options = {} ) { // -> bool
	if ( !(modifiers.network_seed || modifiers.properties || modifiers.origin_time) )
	    throw new TypeError(`One of the DNA modifier opts is required: network_seed, properties, origin_time`);

	const input			= {
	    "app_id":		app_id,				// where to put new cell
	    "role_name":	role_name,			// Role to clone
	    "name":		options.name,			// Name for new cell
	    "modifiers":	modifiers,			// Modifier opts
	    "membrane_proof":	options.membrane_proof || null, // proof for DNA, if required
	};
	let installed_cell			= await this._request("create_clone_cell", input );

	installed_cell.cell_id			= reformat_cell_id( installed_cell.cell_id );

	return installed_cell;
    }

    async close ( timeout ) {
	const conn			= await this.connection();
	return await conn.close( timeout );
    }
}
set_tostringtag( AgentClient, "AgentClient" );


export function logging () {
    log.debug				= true;
}

export default {
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
};
