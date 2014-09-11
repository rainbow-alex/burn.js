"use strict";
let NodeFiber = require( "fibers" );
let vm = require( "libburn/vm" );

let fiber = module.exports;

fiber.exposes = new vm.Module( {
	
	fork: new vm.Function( function( fiber, args ) {
		let forkFiber = new vm.Fiber( fiber.vm );
		setImmediate( function() {
			try {
				NodeFiber( function() {
					args[0].call( forkFiber, [] );
				} ).run();
			} catch( e ) {
				if( e instanceof vm.Value ) {
					forkFiber.vm.dispatchUncaughtThrowable( e );
				} else {
					throw e;
				}
			}
		} );
	} ),
	
	yield: new vm.AsyncFunction( function( fiber, args, cb ) {
		setImmediate( cb );
	} ),
	
} );
