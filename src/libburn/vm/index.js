"use strict";
let NodeFiber = require( "fibers" );

let vm = exports;

vm.Value = CLASS( {
	isTruthy: function( fiber ) {
		return true;
	},
	toBurnString: function( fiber ) {
		return new vm.String( this.repr );
	},
	getProperty: function( fiber, name ) {
		throw new errors.TypeErrorInstance(
			"TypeError: " + this.repr + " does not have property " + name + ".",
			fiber.stack
		);
	},
	suggestName: function( name ) {},
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
	isTruthy: function( fiber ) {
		return this.value;
	},
	toBurnString: function( fiber ) {
		return new vm.String( this.value ? "true" : "false" );
	},
} );

vm.Integer = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Integer>",
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	eq: function( fiber, other ) {
		return this.value === other.value;
	},
	toBurnString: function( fiber ) {
		return new vm.String( "" + this.value );
	},
} );

vm.Float = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<Float>",
	isTruthy: function( fiber ) {
		return this.value !== 0;
	},
	toBurnString: function( fiber ) {
		return new vm.String( "" + this.value );
	},
} );

vm.String = CLASS( vm.Value, {
	init: function( value ) {
		this.value = value;
	},
	repr: "<String>",
	isTruthy: function( fiber ) {
		return this.value.length > 0;
	},
	toBurnString: function( fiber ) {
		return this;
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

vm.origin = require( "./origin" );
vm.Fiber = require( "./Fiber" );
vm.helpers = require( "./helpers" );
vm.runtime = require( "./runtime" );
vm.VirtualMachine = require( "./VirtualMachine" );

let errors = require( "libburn/builtin/burn/errors" );
