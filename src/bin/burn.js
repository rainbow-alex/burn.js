#!/usr/bin/env node-harmony
"use strict";
let libburn = require( "libburn" );
let path = require( "path" );

let vm = new libburn.vm.VirtualMachine( [
	process.cwd(),
	path.resolve( __dirname, "../modules" ),
] );

let dump = false;
let origin = null;
let script_argv;

( function() {
	
	let i = 2;
	for( ; i < process.argv.length ; i++ ) {
		if( process.argv[i] === "-h" || process.argv[i] === "--help" ) {
			console.log( "usage: burn.js [options...] <file> [args...]" );
			console.log();
			console.log( "Read and run burn program from file. Use - to from stdin." );
			console.log();
			console.log( "options:" );
			console.log( "-h | --help     Print this help message and exit." );
			console.log( "-v | --version  Print version and exit." );
			process.exit();
		} else if( process.argv[i] === "-v" || process.argv[i] === "--version" ) {
			console.log( "Burn 0.1" );
			process.exit();
		} else if( process.argv[i] === "--dump" ) {
			dump = true;
		} else if( process.argv[i] === "-" ) {
			origin = new libburn.origin.Stdin();
			break;
		} else {
			origin = new libburn.origin.Script( process.argv[i] );
			break;
		}
	}
	
	script_argv = process.argv.slice( i );
}() );

vm.onUncaughtThrowable( function( e ) {
	printRuntimeError( e );
	process.exit( 1 );
} );

if( ! origin ) {
	console.error( "Error: no input specified." );
	process.exit( 1 );
	
} else if( dump ) {
	if( script_argv.length > 1 ) {
		console.error( "Error: too many arguments." );
		process.exit( 1 );
	}
	try {
		console.log( JSON.stringify( vm.parse( origin ), null, "\t" ) );
	} catch( e ) {
		CATCH_IF( e, e instanceof libburn.lang.Error );
		printError( e );
		process.exit( 1 );
	}
	
} else {
	try {
		vm.start( origin, script_argv );
	} catch( e ) {
		CATCH_IF( e, e instanceof libburn.lang.Error );
		printError( e );
		process.exit( 1 );
	}
}

function printError( e ) {
	console.error( e.message );
	if( e.line ) {
		console.error( "in " + e.origin + " on line " + e.line );
		let line = e.origin.sourceCode.toString().split("\n")[ e.line - 1 ];
		let indicator = line.substr( 0, e.offset ).replace(/\t/g, "    " ).replace( /./g, " " ) + "^";
		line = line.replace(/\t/g, "    " );
		console.error( "\t" + line );
		console.error( "\t" + indicator );
	} else {
		console.error( "in " + e.origin );
	}
}

function printRuntimeError( e ) {
	let Fiber = libburn.vm.Fiber;
	
	console.error( e.toBurnString().value );
	
	if( e.stack ) {
		for( let i = e.stack.length - 1 ; i >= 0 ; i-- ) {
			let next = e.stack[i+1];
			if( ! next ) {
				process.stderr.write( "in " );
			} else if( next instanceof Fiber.FunctionFrame || next instanceof Fiber.BoundMethodFrame ) {
				process.stderr.write( "called from " );
			} else if( next instanceof Fiber.ImportFrame ) {
				process.stderr.write( "imported from " );
			} else if( next instanceof Fiber.IncludeFrame ) {
				process.stderr.write( "included from " );
			} else {
				console.assert( false );
			}
			let frame = e.stack[i];
			if( frame instanceof libburn.vm.Fiber.RootFrame ) {
				process.stderr.write( frame.origin.toString() );
			} else if( frame instanceof libburn.vm.Fiber.FunctionFrame ) {
				if( frame.function_.name ) {
					process.stderr.write( "function " + frame.function_.name );
				} else {
					process.stderr.write( "anonymous function" );
				}
				if( frame.function_.origin ) {
					process.stderr.write( " (" + frame.function_.origin + ":" + frame.function_.line + ")" );
				} else {
					process.stderr.write( " (builtin)" );
				}
			} else if( frame instanceof Fiber.BoundMethodFrame ) {
				process.stderr.write( "method " + frame.boundMethod.value.repr + "." + frame.boundMethod.method );
			} else if( frame instanceof libburn.vm.Fiber.ImportFrame ) {
				process.stderr.write( frame.origin.toString() );
			} else if( frame instanceof libburn.vm.Fiber.IncludeFrame ) {
				process.stderr.write( frame.origin.toString() );
			} else {
				console.assert( false );
			}
			if( frame.line ) {
				process.stderr.write( " on line " + frame.line );
			}
			process.stderr.write( "\n" );
		}
	}
}
