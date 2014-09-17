#!/usr/bin/env node-harmony
"use strict";
let fs = require( "fs" );

let ast = JSON.parse( fs.readFileSync( "/dev/stdin" ).toString() );

walk( ast );

function walk( node ) {
	if( Array.isArray( node ) ) {
		node.forEach( walk );
	} else {
		if( node.type.match( /^token\// ) ) {
			if( node.index === 0 && node.precedingWhitespace !== "" ) {
				process.stdout.write( '<span class="burn-whitespace">' );
				process.stdout.write( node.precedingWhitespace );
				process.stdout.write( '</span>' );
			}
			process.stdout.write( '<span class="' + typeToClass( node.type ) + '">' );
			process.stdout.write( htmlEscape( node.value ) );
			process.stdout.write( '</span>' );
			if( node.succeedingWhitespace !== "" ) {
				process.stdout.write( '<span class="burn-whitespace">' );
				process.stdout.write( node.succeedingWhitespace );
				process.stdout.write( '</span>' );
			}
		} else {
			process.stdout.write( '<span class="' + typeToClass( node.type ) + '">' );
			node.children.forEach( function( c ) {
				if( c[1] ) {
					walk( c[1] );
				}
			} );
			process.stdout.write( '</span>' );
		}
	}
}

function typeToClass( t ) {
	return t.split( "/" ).map( function( p ) { return "burn-" + p; } ).join( " " );
}

function htmlEscape( s ) {
	return String( s )
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
	;
}
