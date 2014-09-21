"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let types = module.exports;

types.Nothing = new util.JsInstanceofType( Value.Nothing );

types.Boolean = new util.JsInstanceofType( Value.Boolean );

types.Integer = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return v instanceof Value.Integer;
	},
	property_Negative: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && v.value < 0;
		},
		safe: true,
		permanent: true,
	} ),
	property_Zero: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && v.value === 0;
		},
		safe: true,
		permanent: true,
	} ),
	property_Positive: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && v.value > 0;
		},
		safe: true,
		permanent: true,
	} ),
	property_Nonnegative: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && v.value >= 0;
		},
		safe: true,
		permanent: true,
	} ),
	property_Nonpositive: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && v.value <= 0;
		},
		safe: true,
		permanent: true,
	} ),
	property_Byte: new Value.Type( {
		typeTest: function( fiber, v ) {
			return v instanceof Value.Integer && 0 <= v.value && v.value < 256;
		},
		safe: true,
		permanent: true,
	} ),
} );
types.Integer.Nonnegative = types.Integer.property_Nonnegative;

types.Float = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, value ) {
		return value instanceof Value.Float;
	},
} );

types.Character = new util.JsInstanceofType( Value.Character );
types.String = new util.JsInstanceofType( Value.String );

types.Bytes = new util.JsInstanceofType( Value.Bytes );

types.Function = new util.JsInstanceofType( Value.Function );

types.Type = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return Boolean( v.typeTest );
	},
	property_Permanent:  new Value.Type( {
		typeTest: function( fiber, v ) {
			return types.Type.typeTest( fiber, v ) && v.permanent;
		},
		safe: true,
		permanent: true,
	} ),
} );

types.Tuple = new util.JsInstanceofType( Value.Tuple );

types.List = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, value ) {
		return value instanceof Value.List;
	},
	call_of: function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{ type: types.Type },
		] );
		return new types.ListOf( args[0] );
	},
} );

types.ListOf = CLASS( Value.Type, {
	init: function( type ) {
		this.type = type;
	},
	get safe() {
		return this.types.every( function( t ) { return t.safe; } );
	},
	get permanent() {
		return this.types.every( function( t ) { return t.permanent; } );
	},
	typeTest: function( fiber, value ) {
		if( ! ( value instanceof Value.List ) ) {
			return false;
		}
		return value.items.every( this.type.typeTest.bind( this.type, fiber ) );
	},
} );

types.Module = new util.JsInstanceofType( Value.Module );

types.Safe = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return v.safe;
	},
} );

types.Truthy = new Value.Type( {
	safe: true,
	permanent: false,
	typeTest: function( fiber, v ) {
		return v.isTruthy();
	},
} );
types.Falsy = new Value.Type( {
	safe: true,
	permanent: false,
	typeTest: function( fiber, v ) {
		return ! v.isTruthy();
	},
} );

types.Callable = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return typeof v.call === "function";
	},
} );

types.Iterable = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return typeof v.iter === "function";
	},
} );

types.Something = new Value.Type( {
	safe: true,
	permanent: true,
	typeTest: function( fiber, v ) {
		return ! ( v instanceof Value.Nothing );
	},
} );

types.exposes = new Value.Module( {
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	Character: types.Character,
	String: types.String,
	Bytes: types.Bytes,
	Function: types.Function,
	Type: types.Type,
	Tuple: types.Tuple,
	List: types.List,
	Module: types.Module,
	
	Safe: types.Safe,
	Truthy: types.Truthy,
	Falsy: types.Falsy,
	Callable: types.Callable,
	Iterable: types.Iterable,
	
	Something: types.Something,
} );
