"use strict";
let Value = require( "libburn/vm/Value" );
let types = require( "./types" );
let errors = require( "./errors" );
let util = require( "libburn/vm/util" );
let msg = require( "libburn/messages" );

let implicit = module.exports;

implicit.exposes = new Value.Module( {
	
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Module: types.Module,
	List: types.List,
	Type: types.Type,
	Something: types.Something,
	Callable: types.Callable,
	
	NameError: errors.NameError,
	TypeError: errors.TypeError,
	PropertyError: errors.PropertyError,
	ArgumentError: errors.ArgumentError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	AssertionError: errors.AssertionError,
	
	main: new Value.Function( function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{ type: types.Callable },
		] );
		fiber.vm.main = args[0];
	}, { safe: true } ),
	
	repr: new Value.Function( function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{},
		] );
		return new Value.String( args[0].repr );
	}, { safe: true } ),
	
	assert: new Value.Function( function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{},
			{ type: types.String, default: null }
		] );
		if( ! args[0].isTruthy( fiber ) ) {
			if( args[1] instanceof Value.String ) {
				throw new errors.AssertionErrorInstance(
					"AssertionError: " + args[1].value,
					fiber.stack
				);
			} else {
				throw new errors.AssertionErrorInstance( "AssertionError", fiber.stack );
			}
		}
	}, { safe: true } ),
	
} );
