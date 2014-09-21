"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );
let types = require( "libburn/builtin/burn/types" );

let fiber = module.exports;

fiber.exposes = new Value.Module( {
	
	fork: new Value.Function( {
		safe: true,
		implementation: function( fiber, args ) {
			util.validateCallArguments( fiber, this, args, [
				{ type: types.Callable },
			] );
			fiber.vm.fork( function( forkFiber ) {
				args[0].call( forkFiber, [] );
			} );
		},
	} ),
	
	yield: new Value.Function( {
		safe: true,
		implementation: function( fiber, args ) {
			util.validateCallArguments( fiber, this, args, [] );
			fiber.async( function( cb ) {
				setImmediate( cb );
			} );
		},
	} ),
	
} );
