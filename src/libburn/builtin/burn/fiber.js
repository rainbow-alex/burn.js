"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );
let types = require( "libburn/builtin/burn/types" );

let fiber = module.exports;

fiber.exposes = new Value.Module( {
	
	fork: new Value.Function( function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{ type: types.Callable },
		] );
		fiber.vm.fork( function( forkFiber ) {
			args[0].call( forkFiber, [] );
		} );
	}, { safe: true } ),
	
	yield: new Value.Function( function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [] );
		fiber.async( function( cb ) {
			setImmediate( cb );
		} );
	}, { safe: true } ),
	
} );
