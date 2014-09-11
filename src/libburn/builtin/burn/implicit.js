"use strict";
let vm = require( "libburn/vm" );
let types = require( "./types" );
let errors = require( "./errors" );
let list = require( "./list" );

let implicit = module.exports;

implicit.exposes = new vm.Module( {
	
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	Number: types.Number,
	String: types.String,
	Function: types.Function,
	Type: types.Type,
	
	List: list.List,
	
	TypeError: errors.TypeError,
	ArgumentError: errors.ArgumentError,
	
	main: new vm.Function( function( fiber, args ) {
		fiber.vm.main = args[0]; // TODO typecheck
	} ),
	
} );
