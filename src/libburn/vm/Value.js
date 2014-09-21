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
	
	safe: false,
	
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
	toBurnString: function( fiber ) {
		return new Value.String( this.repr );
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
} );

Value.Nothing = CLASS( Value, {
	
	safe: true,
	
	repr: "<Nothing>",
	
	isTruthy: function( fiber ) {
		return false;
	},
	canEq: function( value ) {
		return value instanceof Value.Nothing;
	},
	eq: function( fiber, other ) {
		return true;
	},
	toBurnString: function( fiber ) {
		return new Value.String( "nothing" );
	},
} );

Value.Boolean = CLASS( Value, {
	
	init: function( value ) {
		this.value = value;
	},
	
	safe: true,
	
	repr: "<Boolean>",
	
	isTruthy: function( fiber ) {
		return this.value;
	},
	canEq: function( value ) {
		return value instanceof Value.Boolean;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	toBurnString: function( fiber ) {
		return new Value.String( this.value ? "true" : "false" );
	},
} );

Value.Integer = CLASS( Value, {
	
	init: function( value ) {
		this.value = value;
	},
	
	safe: true,
	
	repr: "<Integer>",
	
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
	toBurnString: function( fiber ) {
		return new Value.String( String(this.value) );
	},
} );

Value.Float = CLASS( Value, {
	
	init: function( value ) {
		this.value = value;
	},
	
	safe: true,
	
	repr: "<Float>",
	
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
	toBurnString: function( fiber ) {
		if( Math.round( this.value ) === this.value ) {
			return new Value.String( this.value.toFixed( 1 ) );
		} else {
			return new Value.String( this.value.toString() );
		}
	},
} );

Value.Character = CLASS( Value, {
	
	init: function( value ) {
		this.value = value;
	},
	
	safe: true,
	
	repr: "<Character>",
	
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
	toBurnString: function( fiber ) {
		return new Value.String( this.value );
	},
} );

Value.String = CLASS( Value, {
	init: function( value ) {
		this.value = value;
	},
	
	safe: true,
	
	repr: "<String>",
	
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
	toBurnString: function( fiber ) {
		return this;
	},
	
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return new Value.Character( this.value.at( index.value ) );
	},
	iter: function() {
		let value = this.value;
		let i = 0;
		return function() {
			let c = value.at( i++ );
			return c && new Value.Character( c );
		};
	},
	
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
	
	safe: true,
	
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
	
	iter: function() {
		let value = this.value;
		let i = 0;
		return function() {
			let b = value[i++];
			return b && new Value.Integer( b );
		};
	},
	
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return new Value.Integer( this.value[ index.value ] );
	},
	
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
	
	get safe() {
		for( let i = 0 ; i < this.items.length ; i++ ) {
			if( ! this.items[i].safe ) {
				return false;
			}
		}
		return true;
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
	
	iter: function() {
		let items = this.items;
		let i = 0;
		return function() {
			return items[ i++ ];
		};
	},
	
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer.Nonnegative, index );
		return this.items[ index.value ];
	},
	
	get_length: function( fiber ) {
		return new Value.Integer( this.items.length );
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
	
	safe: true,
	
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
} );

Value.Type = CLASS( Value, {
	
	safe: false,
	permanent: false,
	
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	repr: "<Type>",
	
	toBurnString: function() {
		return new Value.String( this.name || this.repr );
	},
} );

Value.TypeUnion = CLASS( Value, {
	
	init: function( left, right ) {
		this.left = left;
		this.right = right;
	},
	
	// TODO get safe
	// TODO get permanent
	
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
	
	// TODO get safe
	// TODO get permanent
	
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
	
	iter: function() {
		let items = this.items;
		let i = 0;
		return function() {
			return items[ i++ ];
		};
	},
	
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer, index );
		return this.items[ index.value ];
	},
	setIndex: function( fiber, index, value ) {
		util.validateIndex( fiber, this, types.Integer, index );
		this.items[ index.value ] = value;
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

Value.Class = CLASS( Value, {
	
	init: function( properties, methods ) {
		this.properties = properties;
		this.methods = methods;
	},
	
	suggestName: function( name ) {
		this.name = this.name || name;
	},
	get repr() {
		return this.name || "<Class>";
	},
	
	new_: function() {
		return new Value.ClassInstance( this );
	},
	
	instanceCanGet: function( name ) {
		return Boolean( this.properties[ name ] || this.methods[ name ] );
	},
	instanceGet: function( fiber, instance, name ) {
		if( this.methods[ "magic:get:" + name ] ) {
			return this.methods[ "magic:get:" + name ].call( fiber, instance, [] );
		} else if( this.methods[ name ] ) {
			return new Value.Class.BoundMethod( instance, this.methods[ name ] );
		} else {
			return instance[ "$" + name ] || new Value.Nothing();
		}
	},
	instanceCanSet: function( name ) {
		return Boolean( this.properties[ name ] );
	},
} );

Value.Class.Property = CLASS( {
	
	init: function( type ) {
		this.type = type;
	},
} );

Value.Class.Method = CLASS( {
	
	init: function( parameters, returnType, implementation ) {
		this.parameters = parameters;
		this.returnType = returnType;
		this.implementation = implementation;
	},
	
	callFor: function( fiber, callee, instance, args ) {
		fiber.stack.push( new Fiber.BoundMethodFrame( this ) );
		try {
			return (this.implementation)( fiber, callee, instance, args ) || new Value.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

Value.Class.BoundMethod = CLASS( Value, {
	
	init: function( instance, method ) {
		this.instance = instance;
		this.method = method;
	},
	
	get repr() {
		return "<BoundMethod '" + this.method + "' of " + this.instance.repr + ">";
	},
	
	call: function( fiber, args ) {
		return this.method.callFor( fiber, this, this.instance, args );
	},
} );

Value.ClassInstance = CLASS( Value, {
	
	init: function( class_ ) {
		this.class_ = class_;
	},
	
	get repr() {
		return "<" + this.class_.repr + ">";
	},
	
	canGet: function( name ) {
		return this.class_.instanceCanGet( name );
	},
	get: function( fiber, name ) {
		return this.class_.instanceGet( fiber, this, name );
	},
	canSet: function( name ) {
		return this.class_.instanceCanSet( name );
	},
	set: function( fiber, name, value ) {
		this[ "$" + name ] = value;
	},
} );

// these modules depend on Value.*
let util = require( "./util" );
let types = require( "libburn/builtin/burn/types" );
