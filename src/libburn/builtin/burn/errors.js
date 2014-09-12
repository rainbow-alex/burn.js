"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let errors = module.exports;

let ErrorInstance = CLASS( Value.Special, {
	init: function( message, stack ) {
		this.message = message;
		this.stack = stack.map( function( f ) {
			f = Object.create( f );
			f.line = f.line; // effectively freeze .line by copying it to the end of the prototype chain
			return f;
		} );
	},
	repr: "<Error>",
	toString: function() {
		return this.message;
	},
} );

errors.TypeErrorInstance = CLASS( ErrorInstance );
errors.TypeError = new util.JsInstanceofType( errors.TypeErrorInstance );

errors.PropertyErrorInstance = CLASS( ErrorInstance );
errors.PropertyError = new util.JsInstanceofType( errors.PropertyErrorInstance );

errors.ArgumentErrorInstance = CLASS( ErrorInstance );
errors.ArgumentError = new util.JsInstanceofType( errors.ArgumentErrorInstance );

errors.ImportErrorInstance = CLASS( ErrorInstance );
errors.ImportError = new util.JsInstanceofType( errors.ImportErrorInstance );

errors.IncludeErrorInstance = CLASS( ErrorInstance );
errors.IncludeError = new util.JsInstanceofType( errors.IncludeErrorInstance );

errors.exposes = new Value.Module( {
	
	TypeError: errors.TypeError,
	PropertyError: errors.PropertyError,
	ArgumentError: errors.TypeError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	
} );
