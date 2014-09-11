"use strict";
let NodeFiber = require( "fibers" );

let vm = exports;

vm.Value = CLASS( {
	suggestName: function( name ) {},
	toBurnString: function( fiber ) {
		return new vm.String( this.repr );
	},
	getProperty: function( fiber, name ) {
		throw new errors.TypeErrorInstance(
			"TypeError: " + this.repr + " does not have property " + name + ".",
			fiber.stack
		);
	},
	isTruthy: function( fiber ) {
		return true;
	},
	canEq: function( value ) {
		return Object.getPrototypeOf( this ) === Object.getPrototypeOf( value );
	},
	eq: function( other ) {
		return this === other;
	},
	canOrd: function( value ) {
		return false;
	},
} );

vm.Nothing = CLASS( vm.Value, {
	repr: "<Nothing>",
	isTruthy: function( fiber ) {
		return false;
	},
	toBurnString: function( fiber ) {
		return new vm.String( "nothing" );
	},
} );

vm.Boolean = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Boolean>",
	toBurnString: function( fiber ) {
		return new vm.String( this.value ? "true" : "false" );
	},
	isTruthy: function( fiber ) {
		return this.value;
	},
} );

vm.Integer = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Integer>",
	toBurnString: function( fiber ) {
		return new vm.String( "" + this.value );
	},
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	canOrd: function( value ) {
		return value instanceof vm.Integer || value instanceof vm.Float;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
} );

vm.Float = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Float>",
	toBurnString: function( fiber ) {
		return new vm.String( "" + this.value );
	},
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	canOrd: function( value ) {
		return value instanceof vm.Integer || value instanceof vm.Float;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
} );

vm.String = CLASS( vm.Value, {
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
		return value instanceof vm.String;
	},
	lt: function( fiber, other ) {
		return this.value < other.value;
	},
} );

vm.Function = CLASS( vm.Value, {
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
		fiber.stack.push( new vm.Fiber.FunctionFrame( this ) );
		try {
			return this.implementation.call( this, fiber, args ) || new vm.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

vm.AsyncFunction = CLASS( vm.Function, {
	call: function( fiber, args ) {
		fiber.stack.push( new vm.Fiber.FunctionFrame( this ) );
		let currentFiber = NodeFiber.current;
		this.implementation( fiber, args, function( err, res ) {
			if( err ) {
				currentFiber.throwInto( err );
			} else {
				currentFiber.run( res || new vm.Nothing() );
			}
		} );
		try {
			return NodeFiber.yield();
		} finally {
			fiber.stack.pop();
		}
	},
} );

vm.Special = CLASS( vm.Value, {
	repr: "<Special>",
	toBurnString: function( fiber ) {
		return new vm.String( this.toString() );
	},
	toString: function() {
		return this.repr;
	},
	getProperty: function( fiber, name ) {
		if( this[ "getProperty_" + name ] ) {
			return this[ "getProperty_" + name ]( fiber );
		} else if( this[ "callMethod_" + name ] ) {
			return new vm.BoundMethod( this, new vm.Method( function( fiber, owner, args ) {
				return owner[ "callMethod_" + name ]( fiber, args );
			} ) );
		} else {
			vm.Value.prototype.getProperty.call( this, fiber, name );
		}
	},
} );

vm.Module = CLASS( vm.Value, {
	init: function( contents ) {
		if( contents ) {
			for( var k in contents ) {
				this.setProperty( null, k, contents[k] );
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
	setProperty: function( fiber, name, value ) {
		this[ "$" + name ] = value;
		value.suggestName( name );
	},
	getProperty: function( fiber, name ) {
		return this[ "$" + name ] || vm.Value.prototype.getProperty.call( this, fiber, name );
	},
} );

vm.Method = CLASS( vm.Value, {
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
			return "<Method:" + this.name + ">";
		} else {
			return "<Method>";
		}
	},
	call: function( fiber, owner, args ) {
		fiber.stack.push( new vm.Fiber.MethodFrame( this ) );
		try {
			return this.implementation.call( this, fiber, owner, args ) || new vm.Nothing();
		} finally {
			fiber.stack.pop();
		}
	},
} );

vm.AsyncMethod = CLASS( vm.Method, {
	call: function( fiber, owner, args ) {
		fiber.stack.push( new vm.Fiber.MethodFrame( this ) );
		let currentFiber = NodeFiber.current;
		this.implementation( fiber, owner, args, function( err, res ) {
			if( err ) {
				currentFiber.throwInto( err );
			} else {
				currentFiber.run( res || new vm.Nothing() );
			}
		} );
		try {
			return NodeFiber.yield();
		} finally {
			fiber.stack.pop();
		}
	},
} );

vm.BoundMethod = CLASS( vm.Value, {
	init: function( owner, method ) {
		this.owner = owner;
		this.method = method;
	},
	call: function( fiber, args ) {
		return this.method.call( fiber, this.owner, args );
	},
} );

vm.origin = require( "./origin" );
vm.Fiber = require( "./Fiber" );
vm.helpers = require( "./helpers" );
vm.runtime = require( "./runtime" );
vm.VirtualMachine = require( "./VirtualMachine" );

let errors = require( "libburn/builtin/burn/errors" );
