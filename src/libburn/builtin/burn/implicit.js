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
		fiber.vm.main = args[0]; // TODO typecheck
	}, { safe: true } ),
	
	repr: new Value.Function( function( fiber, args ) {
		return new Value.String( args[0].repr );
	}, { safe: true } ),
	
	assert: new ( CLASS( Value.Special, {
		call: function( fiber, args ) {
			if( ! args[0].isTruthy( fiber ) ) {
				throw new errors.AssertionErrorInstance( "", fiber.stack ); // TODO
			}
		},
		safe: true,
		get_throws: function( fiber ) {
			return this._throws;
		},
		_throws: new Value.Function( function( fiber, args ) {
			try {
				args[0].call( fiber );
			} catch( e ) { if( e instanceof Value ) {
				if( ! args[1].typeTest( fiber, e ) ) {
					throw new errors.AssertionErrorInstance( "AssertionError: wrong type", fiber.stack ); // TODO
				} else {
					return;
				}
			} else { throw e; } }
			throw new errors.AssertionErrorInstance( "AssertionError: no error thrown", fiber.stack ); // TODO
		}, { name: "throws", safe: true } ),
	} ) ),
	
} );
