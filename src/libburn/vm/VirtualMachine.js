"use strict";
let NodeFiber = require( "fibers" );
let vm = require( "./" );
let burn = require( "libburn/builtin/burn" );
let Process = require( "libburn/builtin/burn/Process" );

module.exports = CLASS( {
	init: function( path ) {
		this.path = path;
		this._root = {
			burn: burn.exposes,
		};
		this._uncaughtThrowableHandlers = [];
	},
	
	// TODO per fiber!
	onUncaughtThrowable: function( f ) {
		this._uncaughtThrowableHandlers.push( f );
	},
	
	run: function( origin, code ) {
		let fiber = new vm.Fiber( this );
		fiber.stack.push( new vm.Fiber.RootFrame( origin ) );
		vm.runtime._fiber = fiber;
		vm.runtime._origin = origin;
		NodeFiber( function() {
			try {
				eval( code );
				if( fiber.vm.main ) {
					fiber.vm.main.call( fiber, [
						new Process.ProcessInstance(),
					] );
				}
			} catch( e ) {
				if( e instanceof vm.Value ) {
					fiber.vm.dispatchUncaughtThrowable( e );
				} else {
					throw e;
				}
			}
		} ).run();
	},
	
	dispatchUncaughtThrowable: function( e ) {
		if( this._uncaughtThrowableHandlers.length ) {
			this._uncaughtThrowableHandlers.forEach( function( f ) {
				f( e );
			} );
		} else {
			throw e;
		}
	},
} );
