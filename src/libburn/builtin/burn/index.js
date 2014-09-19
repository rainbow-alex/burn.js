"use strict";
let Value = require( "libburn/vm/Value" );

let burn = module.exports;

burn.exposes = new Value.Module( {
	implicit: require( "./implicit" ).exposes,
	types: require( "./types" ).exposes,
	errors: require( "./errors" ).exposes,
	fiber: require( "./fiber" ).exposes,
	sys: require( "./sys" ).exposes,
} );
