"use strict";
let vm = require( "libburn/vm" );
let JsInstanceofType = vm.helpers.JsInstanceofType;

let errors = module.exports;

let ErrorInstance = CLASS( vm.Special, {
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
errors.TypeError = new JsInstanceofType( errors.TypeErrorInstance );

errors.ArgumentErrorInstance = CLASS( ErrorInstance );
errors.ArgumentError = new JsInstanceofType( errors.ArgumentErrorInstance );

errors.ImportErrorInstance = CLASS( ErrorInstance );
errors.ImportError = new JsInstanceofType( errors.ImportErrorInstance );

errors.IncludeErrorInstance = CLASS( ErrorInstance );
errors.IncludeError = new JsInstanceofType( errors.IncludeErrorInstance );

errors.exposes = new vm.Module( {
	
	TypeError: errors.TypeError,
	ArgumentError: errors.TypeError,
	ImportError: errors.ImportError,
	IncludeError: errors.IncludeError,
	
} );
