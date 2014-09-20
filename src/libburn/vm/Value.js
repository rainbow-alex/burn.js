"use strict";
let Fiber = require( "./Fiber" );
let utf8 = require( "../utf8" );

let Value = module.exports = CLASS( {
	init: function( properties ) {
		if( properties ) {
			for( let k in properties ) {
				this[k] = properties[k];
			}
		}
	},
	toBurnString: function( fiber ) {
		return new Value.String( this.repr );
	},
	isTruthy: function( fiber ) {
		return true;
	},
	canEq: function( value ) {
		return false;
	},
	eq: function( fiber, other ) {
		return this === other;
	},
	canOrd: function( value ) {
		return false;
	},
	canGet: function( name ) {
		return Boolean( this[ "property_" + name ] || this[ "get_" + name ] || this[ "call_" + name ] );
	},
	get: function( fiber, name ) {
		if( this[ "property_" + name ] ) {
			return this[ "property_" + name ];
		} else if( this[ "get_" + name ] ) {
			return this[ "get_" + name ]( fiber );
		} else {
			console.assert( this[ "call_" + name ] );
			return new Value.BoundMethod( this, name );
		}
	},
	canSet: function( property ) {
		return false;
	},
	safe: false,
} );

Value.Nothing = CLASS( Value, {
	repr: "<Nothing>",
	toBurnString: function( fiber ) {
		return new Value.String( "nothing" );
	},
	isTruthy: function( fiber ) {
		return false;
	},
	canEq: function( value ) {
		return value instanceof Value.Nothing;
	},
	eq: function( fiber, other ) {
		return true;
	},
	safe: true,
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
	canEq: function( value ) {
		return value instanceof Value.Boolean;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	safe: true,
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
	canEq: function( value ) {
		return value instanceof Value.Integer;
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
	safe: true,
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
	canEq: function( value ) {
		return value instanceof Value.Float;
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
	safe: true,
} );

Value.Character = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Character>",
	toBurnString: function( fiber ) {
		return new Value.String( this.value );
	},
	isTruthy: function( fiber ) {
		return true;
	},
	canEq: function( value ) {
		return value instanceof Value.Character;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	canOrd: function( other ) {
		return other instanceof Value.Character;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
	safe: true,
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
	canEq: function( value ) {
		return value instanceof Value.String;
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
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return new Value.Character( this.value.at( index.value ) );
	},
	safe: true,
	get_length: function( fiber ) {
		return new Value.Integer( utf8.length( this.value ) );
	},
	call_encode: function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [] );
		return new Value.Bytes( utf8.encode( this.value ) );
	},
} );

Value.Bytes = CLASS( Value, {
	init: function( value ) {
		if( Array.isArray( value ) ) {
			value = new Buffer( value );
		}
		this.value = value;
	},
	repr: "<Bytes>",
	isTruthy: function( fiber ) {
		return this.value.length > 0;
	},
	canEq: function( value ) {
		return value instanceof Value.Bytes;
	},
	eq: function( fiber, other ) {
		if( this.value.length !== other.value.length ) {
			return false;
		}
		for( let i = 0 ; i < this.value.length ; i++ ) {
			if( this.value[i] !== other.value[i] ) {
				return false;
			}
		}
		return true;
	},
	// TODO ord
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return new Value.Integer( this.value[ index.value ] );
	},
	safe: true,
	get_length: function( fiber ) {
		return new Value.Integer( this.value.length );
	},
	call_decode: function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [] );
		return new Value.String( utf8.decode( this.value ) );
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
	canEq: function( value ) {
		return value instanceof Value.Function;
	},
	call: function( fiber, args ) {
		fiber.stack.push( new Fiber.FunctionFrame( this ) );
		try {
			return this.implementation( fiber, this, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
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

Value.Tuple = CLASS( Value, {
	init: function( items ) {
		this.items = items;
	},
	repr: "<Tuple>",
	isTruthy: function( fiber ) {
		return this.items.length > 0;
	},
	canEq: function( other ) {
		if( ! other instanceof Value.Tuple ) {
			return false;
		}
		if( this.items.length !== other.items.length ) {
			return false;
		}
		for( let i = 0 ; i < this.items.length ; i++ ) {
			if( ! this.items[ i ].canEq( other.items[ i ] ) ) {
				return false;
			}
		}
		return true;
	},
	eq: function( fiber, other ) {
		for( let i = 0 ; i < this.get_length() ; i++ ) {
			if( ! this.items[ i ].eq( other.items[ i ] ) ) {
				return false;
			}
		}
		return true;
	},
	// TODO ord
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return this.items[ index.value ];
	},
	get_length: function( fiber ) {
		return new Value.Integer( this.items.length );
	},
	get safe() {
		for( let i = 0 ; i < this.items.length ; i++ ) {
			if( ! this.items[i].safe ) {
				return false;
			}
		}
		return true;
	},
} );

Value.Module = CLASS( Value, {
	init: function( contents ) {
		if( contents ) {
			for( var k in contents ) {
				console.assert( contents[k] instanceof Value, "\"" + k + "\" should be a Value" );
				console.assert( contents[k].safe, "\"" + k + "\" should be Safe" );
				this[ "$" + k ] = contents[k];
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
	canEq: function( value ) {
		return value instanceof Value.Module;
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
		this[ "$" + name ] = value;
	},
	safe: true,
} );

Value.Type = CLASS( Value, {
	repr: "<Type>",
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	toBurnString: function() {
		return new Value.String( this.name || this.repr );
	},
	safe: false,
	permanent: false,
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
	// todo get safe
	// todo get permanent
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
	// todo get safe
	// todo get permanent
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
			{},
		] );
		this.items.push( args[0] );
	},
} );

// these modules depend on Value.*
let util = require( "./util" );
let types = require( "libburn/builtin/burn/types" );
