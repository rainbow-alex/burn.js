#!/usr/bin/env node-harmony
"use strict";
let burn = require( "libburn" );
let path = require( "path" );

let origin;
let verbose = true;
let remaining_args;

( function() {
	
	let i = 2;
	for( ; i < process.argv.length ; i++ ) {
		if( process.argv[i] === "-h" || process.argv[i] === "--help" ) {
			console.log( "usage: burn.js [options...] <file> [args...]" );
			console.log();
			console.log( "Read and run burn program from file. Use - to from stdin." );
			console.log();
			console.log( "options:" );
			console.log( "-h | --help     Print this help message." );
			process.exit();
		} else if( process.argv[i] === "-q" || process.argv[i] === "--quiet" ) {
			verbose = false;
		} else if( process.argv[i] === "-" ) {
			origin = new burn.vm.origin.StdinOrigin();
			break;
		} else {
			origin = new burn.vm.origin.ScriptOrigin( process.argv[i] );
			break;
		}
	}
	
	remaining_args = process.argv.slice( i + 1 );
}() );

let vm = new burn.vm.VirtualMachine( [
	process.cwd(),
	path.join( __dirname, "../modules" ),
] );

vm.onUncaughtThrowable( function( e ) {
	printRuntimeError( e );
	process.exit( 1 );
} );

if( ! origin ) {
	console.error( "REPL is not implemented in burn.js." );
	process.exit( 1 );
} else {
	let ast;
	try {
		ast = burn.lang.parse( burn.lang.lex( origin ) );
		ast.resolve();
	} catch( e ) {
		if( e instanceof burn.lang.Error ) {
			printError( e );
			process.exit( 1 );
		} else {
			throw e;
		}
	}
	let code = ast.compile();
	vm.run( origin, code );
}

function printError( e ) {
	console.error( e.message );
	console.error( "in " + e.origin + " on line " + e.line );
	let line = e.origin.source.split("\n")[ e.line - 1 ];
	let indicator = line.substr( 0, e.offset ).replace(/\t/g, "    " ).replace( /./g, " " ) + "^";
	line = line.replace(/\t/g, "    " );
	console.error( "\t" + line );
	console.error( "\t" + indicator );
}

function printRuntimeError( e ) {
	console.error( e.toBurnString().value );
	if( e.stack ) {
		for( let i = e.stack.length - 1 ; i >= 0 ; i-- ) {
			let next = e.stack[i+1];
			if( ! next ) {
				process.stderr.write( "in " );
			} else if( next instanceof burn.vm.Fiber.FunctionFrame ) {
				process.stderr.write( "called from " );
			} else if( next instanceof burn.vm.Fiber.ImportFrame ) {
				process.stderr.write( "imported from " );
			} else if( next instanceof burn.vm.Fiber.IncludeFrame ) {
				process.stderr.write( "included from " );
			} else {
				console.assert( false );
			}
			let frame = e.stack[i];
			if( frame instanceof burn.vm.Fiber.RootFrame ) {
				process.stderr.write( frame.origin.toString() );
			} else if( frame instanceof burn.vm.Fiber.FunctionFrame ) {
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
			} else if( frame instanceof burn.vm.Fiber.ImportFrame ) {
				process.stderr.write( frame.origin.toString() );
			} else if( frame instanceof burn.vm.Fiber.IncludeFrame ) {
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