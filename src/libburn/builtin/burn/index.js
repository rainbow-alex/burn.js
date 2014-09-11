"use strict";
let vm = require( "libburn/vm" );

let burn = module.exports;

burn.exposes = new vm.Module( {
	types: require( "./types" ).exposes,
	errors: require( "./errors" ).exposes,
	fiber: require( "./fiber" ).exposes,
	implicit: require( "./implicit" ).exposes,
	Process: require( "./Process" ).exposes,
	security: require( "./security" ).exposes,
} );
