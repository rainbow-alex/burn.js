"use strict";
let Value = require( "libburn/vm/Value" );

let fiber = module.exports;

fiber.exposes = new Value.Module( {
	
	fork: new Value.Function( function( fiber, callee, args ) {
		// TODO validate args
		fiber.vm.fork( function( forkFiber ) {
			args[0].call( forkFiber, [] );
		} );
	}, { safe: true } ),
	
	yield: new Value.AsyncFunction( function( fiber, callee, args, cb ) {
		// TODO validate args
		setImmediate( cb );
	}, { safe: true } ),
	
} );
