"use strict";
let Value = require( "libburn/vm/Value" );
let types = require( "./types" );
let errors = require( "./errors" );
let list = require( "./list" );
let util = require( "libburn/vm/util" );

let implicit = module.exports;

implicit.exposes = new Value.Module( {
	
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Module: types.Module,
	Type: types.Type,
	Something: types.Something,
	
	NameError: errors.NameError,
	TypeError: errors.TypeError,
	PropertyError: errors.PropertyError,
	ArgumentError: errors.ArgumentError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	AssertionError: errors.AssertionError,
	
	List: list.List,
	
	main: new Value.Function( function( fiber, args ) {
		util.validateFunctionCallArguments( fiber, this, [ { type: types.Callable } ], args );
		fiber.vm.main = args[0];
	}, { safe: true } ),
	
	repr: new Value.Function( function( fiber, args ) {
		return new Value.String( args[0].repr );
	}, { safe: true } ),
	
	assert: new ( CLASS( Value.Special, {
		call: function( fiber, args ) {
			util.validateFunctionCallArguments( fiber, this, [ {}, { type: types.String, default: new Value.Nothing() } ], args );
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
		safe: true,
		get_throws: function( fiber ) {
			return this._throws;
		},
		_throws: new Value.Function( function( fiber, args ) {
			try {
				args[0].call( fiber );
			} catch( e ) {
				CATCH_IF( e, e instanceof Value )
				if( ! args[1].typeTest( fiber, e ) ) {
					throw new errors.AssertionErrorInstance( "AssertionError: wrong type", fiber.stack ); // TODO
				} else {
					return;
				}
			}
			throw new errors.AssertionErrorInstance( "AssertionError: no error thrown", fiber.stack ); // TODO
		}, { name: "throws", safe: true } ),
	} ) ),
	
} );
