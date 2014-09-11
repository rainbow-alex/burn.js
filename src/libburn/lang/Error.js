"use strict";

let Error = module.exports = CLASS( {
	init: function( message, origin, line, offset ) {
		this.message = message;
		if( origin.origin ) { // TODO Token base class
			let token = origin;
			this.origin = token.origin;
			this.line = token.line;
			this.offset = token.offset;
		} else {
			this.origin = origin;
			this.line = line;
			this.offset = offset;
		}
	},
	toString: function() {
		return this.message;
	},
} );
