"use strict";
let fs = require( "fs" );

exports.Script = CLASS( {
	init: function( filename ) {
		this.filename = filename;
	},
	get sourceCode() {
		return fs.readFileSync( this.filename, "utf-8" );
	},
	toString: function() {
		return this.filename;
	},
} );

exports.Stdin = CLASS( {
	get sourceCode() {
		return this._source || ( this._source = fs.readFileSync( "/dev/stdin", "utf-8" ) );
	},
	toString: function() {
		return "<stdin>";
	},
} );
