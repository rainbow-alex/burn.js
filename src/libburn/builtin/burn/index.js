"use strict";
let Value = require( "libburn/vm/Value" );

let burn = module.exports;

burn.exposes = new Value.Module( {
	types: require( "./types" ).exposes,
	errors: require( "./errors" ).exposes,
	list: require( "./list" ).exposes,
	fiber: require( "./fiber" ).exposes,
	implicit: require( "./implicit" ).exposes,
	Process: require( "./Process" ).exposes,
	security: require( "./security" ).exposes,
} );
