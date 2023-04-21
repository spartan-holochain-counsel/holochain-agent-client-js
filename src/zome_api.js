
import { encode, decode }		from '@msgpack/msgpack';
import { log,
	 set_tostringtag }		from './utils.js';


function nonce () {
    return crypto.getRandomValues( new Uint8Array(32) );
}

export class ZomeApi {
    constructor ( name, methods = [] ) {
	this._name			= name;
	this._methods			= methods;
	this._timeout;
    }

    async call ( connection, client_agent, cell_agent, dna, func, payload, signing_handler, secret, timeout ) {
	if ( this._methods.includes( func ) ) {
	    // TODO: implement transformers
	}
	else if ( this._methods !== null && this._methods.length !== 0 ) {
	    throw new Error(`Unknown Zome function: ${func}; expected one of ${ this._methods }`);
	}

	const zomeCall			= {
	    "provenance":	client_agent,
	    "cell_id":		[ dna, cell_agent ],
	    "zome_name":	this._name,
	    "fn_name":		func,
	    "payload":		encode( payload ),
	    "nonce":		nonce(),
	    "expires_at":	(Date.now() + (5 * 60 * 1000)) * 1000,
	    "cap_secret":	secret,
	};
	const signedZomeCall		= await signing_handler( zomeCall );

	if ( !signedZomeCall.signature )
	    log.debug && log("WARNING: Signed zome call is missing the signature property");

	const resp			= await connection.request("call_zome", signedZomeCall, timeout || this._timeout );

	return decode( resp );
    }
}
set_tostringtag( ZomeApi, "ZomeApi" );
