"use strict";
let Fiber = require( "./Fiber" );

let Value = module.exports = CLASS( {
	suggestName: function( name ) {},
	has: function( fiber, property ) {
		return false;
	},
	toBurnString: function( fiber ) {
		return new Value.String( this.repr );
	},
	isTruthy: function( fiber ) {
		return true;
	},
	canEq: function( value ) {
		return Object.getPrototypeOf( this ) === Object.getPrototypeOf( value );
	},
	eq: function( fiber, value ) {
		return this === value;
	},
	canOrd: function( value ) {
		return false;
	},
} );

Value.Nothing = CLASS( Value, {
	repr: "<Nothing>",
	toBurnString: function( fiber ) {
		return new Value.String( "nothing" );
	},
	isTruthy: function( fiber ) {
		return false;
	},
} );

Value.Boolean = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Boolean>",
	toBurnString: function( fiber ) {
		return new Value.String( this.value ? "true" : "false" );
	},
	isTruthy: function( fiber ) {
		return this.value;
	},
} );

Value.Integer = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Integer>",
	toBurnString: function( fiber ) {
		return new Value.String( String(this.value) );
	},
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	canOrd: function( value ) {
		return value instanceof Value.Integer || value instanceof Value.Float;
	},
	lt: function( fiber, value ) {
		return this.value < value.value;
	},
} );

Value.Float = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Float>",
	toBurnString: function( fiber ) {
		return new Value.String( String(this.value) );
	},
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	canOrd: function( value ) {
		return value instanceof Value.Integer || value instanceof Value.Float;
	},
	lt: function( fiber, value ) {
		return this.value < value.value;
	},
} );

Value.String = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<String>",
	toBurnString: function( fiber ) {
		return this;
	},
	isTruthy: function( fiber ) {
		return this.value.length > 0;
	},
	canOrd: function( value ) {
		return value instanceof Value.String;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
} );

Value.Function = CLASS( Value, {
	init: function( implementation, options ) {
		this.implementation = implementation;
		options = options || {};
		this.name = options.name;
		this.origin = options.origin;
		this.line = options.line;
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	get repr() {
		if( this.name ) {
			return "<Function:" + this.name + ">";
		} else {
			return "<Function>";
		}
	},
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.FunctionFrame( this ) );
		try {
			return this.implementation.call( this, fiber, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

Value.AsyncFunction = CLASS( Value.Function, {
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.FunctionFrame( this ) );
		try {
			return require( "./util" ).async(
				this.implementation.bind( this, fiber, args )
			) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

Value.Module = CLASS( Value, {
	init: function( contents ) {
		if( contents ) {
			for( var k in contents ) {
				this.set( null, k, contents[k] );
			}
		}
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	get repr() {
		if( this.name ) {
			return "<Module:" + this.name + ">";
		} else {
			return "<Module>";
		}
	},
	has: function( name ) {
		return Boolean( this[ "$" + name ] );
	},
	get: function( fiber, name ) {
		return this[ "$" + name ];
	},
	set: function( fiber, name, value ) {
		console.assert( value instanceof Value, "\"" + name + "\" should be a Value" );
		this[ "$" + name ] = value;
		value.suggestName( name );
	},
} );

Value.Special = CLASS( Value, {
	repr: "<Special>",
	has: function( name ) {
		return Boolean( this[ "get_" + name ] || this[ "call_" + name ] );
	},
	get: function( fiber, name ) {
		if( this[ "call_" + name ] ) {
			return new Value.Special.BoundMethod( this, name );
		} else {
			return this[ "get_" + name ]( fiber );
		}
	},
	toBurnString: function( fiber ) {
		return new Value.String( this.toString() );
	},
	toString: function() {
		return this.repr;
	},
} );

Value.Special.BoundMethod = CLASS( Value, {
	init: function( value, method ) {
		this.value = value;
		this.method = method;
	},
	get repr() {
		// TODO figure out consistent repr for all value types
		return "<Method " + this.name + ">";
	},
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.MethodFrame( this ) );
		try {
			return this.value[ "call_" + this.method ]( fiber, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );
