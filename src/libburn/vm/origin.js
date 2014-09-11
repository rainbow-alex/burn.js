"use strict";
let fs = require( "fs" );

exports.ScriptOrigin = CLASS( {
	init: function( filename ) {
		this.filename = filename;
	},
	get source() {
		return fs.readFileSync( this.filename, "utf-8" );
	},
	toString: function() {
		return this.filename;
	},
} );

exports.StdinOrigin = CLASS( {
	get source() {
		return this._source || ( this._source = fs.readFileSync( "/dev/stdin", "utf-8" ) );
	},
	toString: function() {
		return "<stdin>";
	},
} );
