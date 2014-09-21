"use strict";
let Value = require( "libburn/vm/Value" );

let burn = module.exports;

burn.exposes = new Value.Module( {
	types: require( "./types" ).exposes,
	errors: require( "./errors" ).exposes,
	implicit: require( "./implicit" ).exposes,
	fiber: require( "./fiber" ).exposes,
	sys: require( "./sys" ).exposes,
} );
