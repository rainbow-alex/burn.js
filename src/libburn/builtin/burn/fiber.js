"use strict";
let Value = require( "libburn/vm/Value" );

let fiber = module.exports;

fiber.exposes = new Value.Module( {
	
	fork: new Value.Function( function( fiber, args ) {
		fiber.vm.fork( function( forkFiber ) {
			args[0].call( forkFiber, [] );
		} );
	} ),
	
	yield: new Value.AsyncFunction( function( fiber, args, cb ) {
		setImmediate( cb );
	} ),
	
} );
