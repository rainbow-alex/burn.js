"use strict";
let NodeFiber = require( "fibers" );
let libburn = require( "libburn" );
let vm = require( "./" );
let runtime = require( "./runtime" );
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
	
	compile: function( origin ) {
		let ast = libburn.lang.parse( libburn.lang.lex( origin ) );
		ast.resolve();
		return ast.compile();
	},
	
	runMain: function( origin, code ) {
		NodeFiber( function() {
			try {
				let fiber = new vm.Fiber( this );
				fiber.stack.push( new vm.Fiber.RootFrame( origin ) );
				this._run( fiber, origin, code );
				if( this.main ) {
					this.main.call( fiber, [
						new Process.ProcessInstance(),
					] );
				}
			} catch( e ) {
				if( e instanceof vm.Value ) {
					this.dispatchUncaughtThrowable( e );
				} else {
					throw e;
				}
			}
		}.bind( this ) ).run();
	},
	
	_run: function( fiber, origin, code ) {
		runtime._fiber = fiber;
		runtime._origin = origin;
		eval( code );
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
