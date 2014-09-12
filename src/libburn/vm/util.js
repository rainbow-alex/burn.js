"use strict";
let nodefibers = require( "fibers" );
let Value = require( "./Value" );

let help = module.exports;

help.async = function( f ) {
	let current = nodefibers.current;
	f( function( err, res ) {
		if( err ) {
			current.throwInto( err );
		} else {
			current.run( res );
		}
	} );
	return nodefibers.yield();
};

help.validateArguments = function( fiber, signature, args ) {
	let frame = fiber.stack[ fiber.stack.length - 1 ];
	let callable = frame.method || frame.function_;
	
	for( let i = 0 ; i < signature.length || i < args.length ; i++ ) {
		let sig = signature[i];
		let arg = args[i];
		
		if( ! sig ) {
			if( signature.length === 0 ) {
				err( callable + " takes no arguments" );
			} else {
				let n = signature.length;
				err( callable + " takes at most " + n + " " + ( n === 1 ? "argument" : "arguments" ) );
			}
		}
		
		if( ! arg ) {
			if( sig.default ) {
				if( typeof sig.default === "function" ) {
					args[i] = sig.default();
				} else {
					args[i] = sig.default;
				}
				continue;
			} else {
				err( "Missing argument " + argumentToString(i) + " for " + callable );
			}
		}
		
		let type;
		if( sig instanceof Value ) {
			type = sig;
		} else {
			type = sig.type;
		}
		if( type && ! type.typeTest( fiber, arg ) ) {
			err( "Argument " + argumentToString(i) + " should be " + type.repr );
		}
	}
	
	function err( m ) {
		let errors = require( "libburn/builtin/burn/errors" );
		throw new errors.ArgumentErrorInstance( m, fiber.stack );
	}
	
	function argumentToString( i ) {
		if( signature[i].name ) {
			return "#" + (i+1) + " ($" + signature[i].name + ")";
		} else {
			return "#" + (i+1);
		}
	}
};

help.validateIndex = function( fiber, type, index ) {
	if( ! type.typeTest( fiber, index ) ) {
		throw new errors.TypeErrorInstance(
			"TypeError: Index must be " + type.repr + ", got " + index.repr,
			fiber.stack
		);
	}
};

help.JsInstanceofType = CLASS( Value.Special, {
	init: function( constructor ) {
		this.constructor = constructor;
	},
	suggestName: function( name ) {
		if( ! this.hasOwnProperty( "repr" ) ) {
			this.repr = name;
		}
	},
	typeTest: function( fiber, v ) {
		return v instanceof this.constructor;
	},
} );

help.JsFunctionType = CLASS( Value.Special, {
	init: function( test ) {
		this.test = test;
	},
	suggestName: function( name ) {
		if( ! this.hasOwnProperty( "repr" ) ) {
			this.repr = name;
		}
	},
	typeTest: function( fiber, v ) {
		return ( this.test )( fiber, v );
	},
} );
