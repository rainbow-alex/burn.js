"use strict";
let Value = require( "libburn/vm/Value" );
let types = require( "./types" );
let errors = require( "./errors" );
let list = require( "./list" );

let implicit = module.exports;

implicit.exposes = new Value.Module( {
	
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Type: types.Type,
	Safe: types.Safe,
	
	TypeError: errors.TypeError,
	ArgumentError: errors.ArgumentError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	
	List: list.List,
	
	main: new Value.Function( function( fiber, args ) {
		fiber.vm.main = args[0]; // TODO typecheck
	}, { safe: true } ),
	
} );
