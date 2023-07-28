
import { decode }			from '@msgpack/msgpack';
import { DnaHash,
	 AgentPubKey }			from '@spartan-hc/holo-hash';


export async function sha512 ( bytes ) {
    if ( typeof crypto === "undefined" || !crypto.subtle )
	throw new Error(`SubtleCrypto (window.crypto.subtle) is required by @spartan-hc/holochain-admin-client for hashing cap secrets.`);

    return await crypto.subtle.digest("SHA-512", bytes );
}

export function set_tostringtag ( cls, name ) {
    Object.defineProperty( cls, "name", {
	value: name || cls.name,
    });
    Object.defineProperty( cls.prototype, Symbol.toStringTag, {
	value: name || cls.name,
	enumerable: false,
    });
}

export function reformat_cell_id ( cell_id ) {
    return [
	new DnaHash(	 cell_id[0] ),
	new AgentPubKey( cell_id[1] ),
    ];
}

export async function reformat_app_info ( app_info ) {
    log.debug && log("Reformatting app info: %s", app_info.installed_app_id );

    // app_info.cell_info		- Map of role name to cell list
    // app_info.cell_info[ role name ]	- 1 Provisioned cell, followed by cloned or stem cells

    app_info.roles			= {};

    for ( let [role_name, cells] of Object.entries( app_info.cell_info ) ) {
	// The first cell info is the original provisioned one.  The rest are clones.
	const role			= app_info.roles[ role_name ] = {
	    "cloned": [],
	};

	const base_cell			= cells.shift();

	if ( base_cell.provisioned ) {
	    role.provisioned		= true;
	    Object.assign( role, base_cell.provisioned );
	    role.cell_id		= reformat_cell_id( role.cell_id );
	}
	else if ( base_cell.stem ) {
	    role.provisioned		= false;
	    Object.assign( role, base_cell.stem );
	}

	delete role.clone_id;

	// `dna_modifiers` is always there whether it's provisioned or stem
	role.dna_modifiers.properties	= decode( role.dna_modifiers.properties );

	for ( let cell of cells ) {
	    if ( cell.cloned ) {
		cell			= cell.cloned;
		cell.cell_id		= reformat_cell_id( cell.cell_id );
		role.cloned.push( cell );
	    }
	    else
		throw new TypeError(`Unknown cell info format: ${Object.keys(cell)}`);
	}
    }

    delete app_info.cell_info;

    app_info.running			= !!app_info.status.running;

    return app_info;
}

export async function hash_secret ( secret ) {
    return new Uint8Array( await sha512( secret ) );
}

export function log ( msg, ...args ) {
    let datetime			= (new Date()).toISOString();
    console.log(`${datetime} [ src/index. ]  INFO: ${msg}`, ...args );
}
log.debug				= false;
