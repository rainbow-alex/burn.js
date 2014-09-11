"use strict";
let vm = require( "./" );

let helpers = module.exports;

helpers.JsInstanceofType = CLASS( vm.Special, {
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

helpers.validateArguments = function( fiber, signature, args ) {
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
		if( sig instanceof vm.Value ) {
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
