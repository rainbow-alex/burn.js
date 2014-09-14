"use strict";
let nodefibers = require( "fibers" );
let Fiber = require( "./Fiber" );
let Value = require( "./Value" );
let msg = require( "../messages" );
let errors;

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

help.validateIndex = function( fiber, context, type, index ) {
	errors = errors || require( "libburn/builtin/burn/errors" );
	
	if( ! type.typeTest( fiber, index ) ) {
		throw new errors.TypeErrorInstance(
			msg.index_wrong_type( context, type, index ),
			fiber.stack
		);
	}
};

help.validateFunctionCallArguments = function( fiber, function_, parameters, args ) {
	errors = errors || require( "libburn/builtin/burn/errors" );
	
	let min = parameters.length;
	while( min && parameters[ min - 1 ].default ) { min--; }
	if( args.length < min ) {
		throw new errors.ArgumentErrorInstance(
			msg.function_call_not_enough_args( function_, parameters, args ),
			fiber.stack
		);
	}
	
	if( args.length > parameters.length ) {
		throw new errors.ArgumentErrorInstance(
			msg.function_call_too_many_args( function_, parameters, args ),
			fiber.stack
		);
	}
	
	parameters.forEach( function( parameter, i ) {
		if( args[i] ) {
			let type = parameter instanceof Value ? parameter : parameter.type;
			if( parameter.type && ! parameter.type.typeTest( fiber, args[i] ) ) {
				throw new errors.ArgumentErrorInstance(
					msg.function_call_wrong_arg_type( function_, parameters, args, i ),
					fiber.stack
				);
			}
		} else {
			console.assert( parameter.default );
			if( typeof parameter.default === "function" ) {
				args[i] = parameter.default();
			} else {
				args[i] = parameter.default;
			}
		}
	} );
};

help.validateMethodCallArguments = function( fiber, context, method, parameters, args ) {
	errors = errors || require( "libburn/builtin/burn/errors" );
	
	let min = parameters.length;
	while( min && parameters[ min - 1 ].default ) { min--; }
	if( args.length < min ) {
		throw new errors.ArgumentErrorInstance(
			msg.method_call_not_enough_args( context, method, parameters, args ),
			fiber.stack
		);
	}
	
	if( args.length > parameters.length ) {
		throw new errors.ArgumentErrorInstance(
			msg.method_call_too_many_args( context, method, parameters, args ),
			fiber.stack
		);
	}
	
	parameters.forEach( function( parameter, i ) {
		if( args[i] ) {
			let type = parameter instanceof Value ? parameter : parameter.type;
			if( parameter.type && ! parameter.type.typeTest( fiber, args[i] ) ) {
				throw new errors.ArgumentErrorInstance(
					msg.method_call_wrong_arg_type( context, method, parameters, args, i ),
					fiber.stack
				);
			}
		} else {
			console.assert( parameter.default );
			if( typeof parameter.default === "function" ) {
				args[i] = parameter.default();
			} else {
				args[i] = parameter.default;
			}
		}
	} );
};

help.JsInstanceofType = CLASS( Value.Special, {
	init: function( constructor ) {
		this.constructor = constructor;
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	repr: "<Type>",
	typeTest: function( fiber, v ) {
		return v instanceof this.constructor;
	},
	isSafe: function() {
		return true;
	},
	isPermanent: function() {
		return true;
	},
	toString: function() {
		return this.name || this.repr;
	},
} );

help.JsFunctionType = CLASS( Value.Special, {
	init: function( test, options ) {
		this.test = test;
		console.assert( options && options.permanent !== undefined, "JsFunctionTypes should specify wether they are Permanent." );
		this.permanent = options.permanent;
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	repr: "<Type>",
	typeTest: function( fiber, v ) {
		return ( this.test )( fiber, v );
	},
	isSafe: function() {
		return true;
	},
	isPermanent: function() {
		return this.permanent;
	},
	toString: function() {
		return this.name || this.repr;
	},
} );
