"use strict";
let fs = require( "fs" );

exports.Script = CLASS( {
	init: function( filename ) {
		this.filename = filename;
	},
	get sourceCode() {
		return fs.readFileSync( this.filename );
	},
	toString: function() {
		return this.filename;
	},
} );

exports.Stdin = CLASS( {
	get sourceCode() {
		return this._source || ( this._source = fs.readFileSync( "/dev/stdin" ) );
	},
	toString: function() {
		return "<stdin>";
	},
} );
