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
	Character: types.Character,
	String: types.String,
	Bytes: types.Bytes,
	Function: types.Function,
	Type: types.Type,
	Tuple: types.Tuple,
	List: types.List,
	Module: types.Module,
	
	Callable: types.Callable,
	Iterable: types.Iterable,
	
	Something: types.Something,
	
	NameError: errors.NameError,
	TypeError: errors.TypeError,
	PropertyError: errors.PropertyError,
	ArgumentError: errors.ArgumentError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	AssertionError: errors.AssertionError,
	
	main: new Value.Function( {
		safe: true,
		implementation: function( fiber, args, nargs ) {
			util.validateCallArguments( fiber, this, args, nargs, [
				{ type: types.Callable },
			] );
			fiber.vm.main = args[0];
		},
	} ),
	
	repr: new Value.Function( {
		safe: true,
		implementation: function( fiber, args, nargs ) {
			util.validateCallArguments( fiber, this, args, nargs, [
				{},
			] );
			return new Value.String( args[0].repr );
		},
	} ),
	
	assert: new Value.Function( {
		safe: true,
		implementation: function( fiber, args, nargs ) {
			util.validateCallArguments( fiber, this, args, nargs, [
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
		},
	} ),
	
} );
