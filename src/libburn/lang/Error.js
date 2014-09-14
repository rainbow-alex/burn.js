"use strict";
let Token = require( "./Token" );

let Error = module.exports = CLASS( {
	init: function( message, origin, line, offset ) {
		this.message = message;
		if( origin instanceof Token ) {
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
