"use strict";
let Fiber = require( "./Fiber" );
let utf8 = require( "../utf8" );

let Value = module.exports = CLASS( {
	toBurnString: function( fiber ) {
		return new Value.String( this.repr );
	},
	isTruthy: function( fiber ) {
		return true;
	},
	canEq: function( value ) {
		return Object.getPrototypeOf( this ) === Object.getPrototypeOf( value );
	},
	eq: function( fiber, other ) {
		return this === other;
	},
	canOrd: function( value ) {
		return false;
	},
	canGet: function( name ) {
		return Boolean( this[ "get_" + name ] || this[ "call_" + name ] );
	},
	get: function( fiber, name ) {
		if( this[ "call_" + name ] ) {
			return new Value.BoundMethod( this, name );
		} else {
			return this[ "get_" + name ]( fiber );
		}
	},
	canSet: function( property ) {
		return false;
	},
	isSafe: function() {
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
	eq: function( fiber, other ) {
		return true;
	},
	isSafe: function() {
		return true;
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
	isSafe: function() {
		return true;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
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
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
	isSafe: function() {
		return true;
	},
} );

Value.Float = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Float>",
	toBurnString: function( fiber ) {
		if( Math.round( this.value ) === this.value ) {
			return new Value.String( this.value.toFixed( 1 ) );
		} else {
			return new Value.String( this.value.toString() );
		}
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
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
	isSafe: function() {
		return true;
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
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	canOrd: function( value ) {
		return value instanceof Value.String;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
	getIndex: function( fiber, index ) {
		// TODO typecheck
		return new Value.String( this.value.at( index.value ) );
	},
	get_length: function( fiber ) {
		return new Value.Integer( utf8.length( this.value ) );
	},
	isSafe: function() {
		return true;
	},
} );

Value.Function = CLASS( Value, {
	init: function( implementation, options ) {
		this.implementation = implementation;
		options = options || {};
		this.name = options.name;
		this.origin = options.origin;
		this.line = options.line;
		this.safe = options.safe || false;
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	get repr() {
		if( this.name ) {
			return "<Function '" + this.name + "'>";
		} else {
			return "<Function>";
		}
	},
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.FunctionFrame( this ) );
		try {
			return this.implementation( fiber, this, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
	isSafe: function() {
		return this.safe;
	},
} );

Value.AsyncFunction = CLASS( Value.Function, {
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.FunctionFrame( this ) );
		try {
			return require( "./util" ).async(
				this.implementation.bind( this, fiber, this, args )
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
				console.assert( contents[k] instanceof Value, "\"" + k + "\" should be a Value" );
				console.assert( contents[k].isSafe(), "\"" + k + "\" should be Safe" );
				this._set( k, contents[k] );
				if( contents[k].suggestName ) {
					contents[k].suggestName( k );
				}
			}
		}
	},
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	get repr() {
		if( this.name ) {
			return "<Module '" + this.name + "'>";
		} else {
			return "<Module>";
		}
	},
	canGet: function( name ) {
		return Boolean( this[ "$" + name ] );
	},
	canSet: function( name ) {
		return true;
	},
	get: function( fiber, name ) {
		return this[ "$" + name ];
	},
	set: function( fiber, name, value ) {
		this._set( name, value );
	},
	_set: function( name, value ) {
		this[ "$" + name ] = value;
	},
	isSafe: function() {
		return true;
	},
} );

Value.Special = CLASS( Value, {
	repr: "<Special>",
	toBurnString: function( fiber ) {
		return new Value.String( this.toString() );
	},
	toString: function() {
		return this.repr;
	},
	isSafe: function() {
		return this.safe || false;
	},
} );

Value.BoundMethod = CLASS( Value, {
	init: function( value, method ) {
		this.value = value;
		this.method = method;
	},
	get repr() {
		return "<BoundMethod '" + this.method + "' of " + this.value.repr + ">";
	},
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.BoundMethodFrame( this ) );
		try {
			return this.value[ "call_" + this.method ]( fiber, this, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

Value.TypeUnion = CLASS( Value, {
	init: function( left, right ) {
		this.left = left;
		this.right = right;
	},
	get repr() {
		return "<Union " + this.left.repr + " " + this.right.repr + ">";
	},
	typeTest: function( fiber, value ) {
		return this.left.typeTest( fiber, value ) || this.right.typeTest( fiber, value );
	},
} );

Value.TypeIntersection = CLASS( Value, {
	init: function( left, right ) {
		this.left = left;
		this.right = right;
	},
	get repr() {
		return "<Intersection " + this.left.repr + " " + this.right.repr + ">";
	},
	typeTest: function( fiber, value ) {
		return this.left.typeTest( fiber, value ) && this.right.typeTest( fiber, value );
	},
} );

Value.List = CLASS( Value, {
	init: function( items ) {
		this.items = items || [];
	},
	repr: "<List>",
	isTruthy: function() {
		return this.items.length !== 0;
	},
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer, index );
		return this.items[ index.value ];
	},
	setIndex: function( fiber, index, value ) {
		util.validateIndex( fiber, this, types.Integer, index );
		this.items[ index.value ] = value;
	},
	iter: function() {
		let list = this;
		let i = 0;
		return function() {
			return list.items[ i++ ];
		};
	},
	get_length: function( fiber ) {
		return new Value.Integer( this.items.length );
	},
	call_push: function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{ type: types.Integer },
		] );
		this.items.push( args[0] );
	},
} );

// these modules depend on Value.*
let util = require( "./util" );
let types = require( "libburn/builtin/burn/types" );
