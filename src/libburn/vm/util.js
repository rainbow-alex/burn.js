"use strict";
let nodefibers = require( "fibers" );
let Fiber = require( "./Fiber" );
let Value = require( "./Value" );
let msg = require( "../messages" );
let errors;

let util = module.exports;

util.async = function( f ) {
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

util.validateCallArguments = function( fiber, callee, args, parameters ) {
	errors = errors || require( "libburn/builtin/burn/errors" );
	
	let min = parameters.length;
	while( min && parameters[ min - 1 ].default !== undefined ) { min--; }
	if( args.length < min ) {
		throw new errors.ArgumentErrorInstance(
			msg.call_not_enough_args( fiber, callee, args, parameters ),
			fiber.stack
		);
	}
	
	if( args.length > parameters.length ) {
		throw new errors.ArgumentErrorInstance(
			msg.call_too_many_args( fiber, callee, args, parameters ),
			fiber.stack
		);
	}
	
	parameters.forEach( function( parameter, i ) {
		if( args[i] ) {
			if( parameter.type && ! parameter.type.typeTest( fiber, args[i] ) ) {
				throw new errors.ArgumentErrorInstance(
					msg.call_wrong_arg_type( fiber, callee, args, parameters, i ),
					fiber.stack
				);
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
};

util.JsInstanceofType = CLASS( Value.Special, {
	init: function( constructor ) {
		console.assert( typeof constructor === "function" );
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

util.JsFunctionType = CLASS( Value.Special, {
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
