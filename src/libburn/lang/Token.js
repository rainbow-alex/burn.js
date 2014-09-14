"use strict";

module.exports = CLASS( {
	init: function( type, value, origin, line, offset ) {
		this.type = type;
		this.value = value;
		this.origin = origin;
		this.line = line;
		this.offset = offset;
	},
} );
