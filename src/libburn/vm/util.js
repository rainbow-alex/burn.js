"use strict";
let Fiber = require( "./Fiber" );
let Value = require( "./Value" );
let msg = require( "../messages" );
let errors;

let util = module.exports;

util.toValue = function( x ) {
	if( x instanceof Value ) {
		return x;
	} else if( x === null ) {
		return new Value.Nothing();
	} else if( typeof x === "boolean" ) {
		return new Value.Boolean( x );
	} else if( typeof x === "number" ) {
		if( Math.floor( x ) === x ) {
			return new Value.Integer( x );
		} else {
			return new Value.Float( x );
		}
	} else if( typeof x === "string" ) {
		return new Value.String( x );
	} else {
		console.assert( false );
	}
};

util.validateIndex = function( fiber, context, type, index ) {
	errors = errors || require( "libburn/builtin/burn/errors" );
	
	if( ! type.typeTest( fiber, index ) ) {
		throw new errors.TypeErrorInstance(
			msg.index_wrong_type( context, type, index ),
			fiber.stack
		);
	}
};

util.validateCallArguments = function( fiber, callee, args, nargs, parameters ) {
	console.assert( Array.isArray( parameters ) );
	
	// put named arguments in order
	nargloop: for( let k in nargs ) {
		for( let i = 0 ; i < parameters.length ; i++ ) {
			if( parameters[i].name === k ) {
				if( args[i] ) {
					throwError( msg.call_named_arg_conflicts_with_positional_arg( fiber, callee, args, parameters, k, i ) );
				}
				args[i] = nargs[k];
				continue nargloop;
			}
		}
		throwError( msg.call_no_such_named_arg( fiber, callee, k ) );
	}
	
	// check if there are too many args
	if( args.length > parameters.length ) {
		throwError( msg.call_too_many_args( fiber, callee, args, parameters ) );
	}
	
	// check if there are missing args
	for( let i = 0 ; i < parameters.length ; i++ ) {
		console.error( parameters[i] );
		if( ! args[i] && parameters[i].default === undefined ) {
			throwError( msg.call_missing_arg( fiber, callee, args, parameters, i ) );
		}
	}
	
	parameters.forEach( function( parameter, i ) {
		if( args[i] ) {
			if( parameter.type && ! parameter.type.typeTest( fiber, args[i] ) ) {
				throwError( msg.call_wrong_arg_type( fiber, callee, args, parameters, i ) );
			}
		} else {
			console.assert( parameter.default !== undefined );
			if( typeof parameter.default === "function" ) {
				args[i] = util.toValue( parameter.default() );
			} else {
				args[i] = util.toValue( parameter.default );
			}
		}
	} );
	
	function throwError( message ) {
		errors = errors || require( "libburn/builtin/burn/errors" );
		throw new errors.ArgumentErrorInstance( message, fiber.stack );
	}
};

util.JsInstanceofType = CLASS( Value.Type, {
	init: function( constructor ) {
		console.assert( typeof constructor === "function" );
		this.constructor = constructor;
	},
	typeTest: function( fiber, v ) {
		return v instanceof this.constructor;
	},
	safe: true,
	permanent: true,
} );
