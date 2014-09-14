"use strict";
let Value = require( "libburn/vm/Value" );

let burn = module.exports;

burn.exposes = new Value.Module( {
	implicit: require( "./implicit" ).exposes,
	types: require( "./types" ).exposes,
	errors: require( "./errors" ).exposes,
	assert: require( "./assert" ).exposes,
	fiber: require( "./fiber" ).exposes,
	security: require( "./security" ).exposes,
	Process: require( "./Process" ).exposes,
	list: require( "./list" ).exposes,
} );
