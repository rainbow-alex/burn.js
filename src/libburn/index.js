"use strict";

global.CLASS = function( parent, properties ) {
	
	let constructor = function() {
		console.assert( this instanceof constructor, "constructor was called without new" );
		if( this.init ) {
			this.init.apply( this, arguments );
		}
	};
	
	if( typeof parent === "function" ) {
		constructor.prototype = Object.create( parent.prototype );
	} else {
		properties = parent || {};
	}
	
	for( var k in properties ) {
		if( properties.hasOwnProperty( k ) ) {
			Object.defineProperty( constructor.prototype, k, Object.getOwnPropertyDescriptor( properties, k ) );
		}
	}
	
	return constructor;
};

global.CATCH_IF = function( e, test ) {
	if( ! test ) {
		throw e;
	}
};

exports.origin = require( "./origin" );
exports.lang = require( "./lang" );
exports.vm = require( "./vm" );
exports.messages = require( "./messages" );
