
import crypto				from 'crypto';

global.crypto				= {
    getRandomValues ( arr ) {
	return crypto.randomBytes( arr.length );
    },
    "subtle": {
	digest ( _, bytes ) {
	    if ( bytes instanceof ArrayBuffer ) // Conversion needed for @noble/ed25519
		bytes			= new Uint8Array( bytes );
	    const hash			= crypto.createHash('sha512')
	    hash.update( bytes );
	    const digest		= hash.digest();
	    return digest;
	},
    },
};

import DefaultExports			from './index.js';

export *				from './index.js';
export default DefaultExports;
