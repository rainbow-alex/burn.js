"use strict";
let Value = require( "libburn/vm/Value" );
let types = require( "./types" );
let errors = require( "./errors" );
let util = require( "libburn/vm/util" );
let msg = require( "libburn/messages" );

let assert = module.exports;

assert.isTruthy = new Value.Function( function( fiber, args ) {
	
	util.validateFunctionCallArguments( fiber, this,
		[ {}, { type: types.String, default: new Value.Nothing() } ],
	args );
	
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
	
}, { safe: true } );

assert.throws = new Value.Function( function( fiber, args ) {
	
	util.validateFunctionCallArguments( fiber, this,
		[ { type: types.Callable }, { type: types.Type } ],
	args );
	
	try {
		args[0].call( fiber );
	} catch( e ) {
		CATCH_IF( e, e instanceof Value )
		if( ! args[1].typeTest( fiber, e ) ) {
			throw new errors.AssertionErrorInstance(
				msg.assert_throws_wrong_type( fiber, args[0], args[1], e ),
				fiber.stack
			);
		} else {
			return;
		}
	}
	
	throw new errors.AssertionErrorInstance(
		msg.assert_throws_didnt_throw( fiber, args[0], args[1] ),
		fiber.stack
	);
	
}, { safe: true } );

assert.exposes = new Value.Module( {
	isTruthy: assert.isTruthy,
	throws: assert.throws,
} );

assert.exposes.call = function( fiber, args ) {
	assert.isTruthy.call( fiber, args );
};
