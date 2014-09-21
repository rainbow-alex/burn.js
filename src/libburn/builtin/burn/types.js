"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let types = module.exports;

types.Nothing = new util.JsInstanceofType( Value.Nothing );
types.Something = new Value.Type( {
	typeTest: function( fiber, v ) {
		return ! ( v instanceof Value.Nothing );
	},
	safe: true,
	permanent: true,
} );

types.Boolean = new util.JsInstanceofType( Value.Boolean );

types.Integer = new Value.Type( {
	typeTest: function( fiber, v ) {
		return v instanceof Value.Integer;
	},
	safe: true,
	permanent: true,
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
	typeTest: function( fiber, value ) {
		return value instanceof Value.Float;
	},
	safe: true,
	permanent: true,
} );

types.Tuple = new util.JsInstanceofType( Value.Tuple );

types.Character = new util.JsInstanceofType( Value.Character );
types.String = new util.JsInstanceofType( Value.String );

types.Bytes = new util.JsInstanceofType( Value.Bytes );

types.Function = new util.JsInstanceofType( Value.Function );

types.Module = new util.JsInstanceofType( Value.Module );

types.Type = new Value.Type( {
	typeTest: function( fiber, v ) {
		return Boolean( v.typeTest );
	},
	safe: true,
	permanent: true,
	property_Permanent:  new Value.Type( {
		typeTest: function( fiber, v ) {
			return types.Type.typeTest( fiber, v ) && v.permanent;
		},
		safe: true,
		permanent: true,
	} ),
} );

types.List = new Value.Type( {
	typeTest: function( fiber, value ) {
		return value instanceof Value.List;
	},
	safe: true,
	permanent: true,
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
	typeTest: function( fiber, value ) {
		if( ! ( value instanceof Value.List ) ) {
			return false;
		}
		return value.items.every( this.type.typeTest.bind( this.type, fiber ) );
	},
	get safe() {
		return this.types.every( function( t ) { return t.safe; } );
	},
	get permanent() {
		return this.types.every( function( t ) { return t.permanent; } );
	},
} );

types.Callable = new Value.Type( {
	typeTest: function( fiber, v ) {
		return typeof v.call === "function";
	},
	safe: true,
	permanent: true,
} );

types.Iterable = new Value.Type( {
	typeTest: function( fiber, v ) {
		return typeof v.iter === "function";
	},
	safe: true,
	permanent: true,
} );

types.Truthy = new Value.Type( {
	typeTest: function( fiber, v ) {
		return v.isTruthy();
	},
	safe: true,
	permanent: false,
} );
types.Falsy = new Value.Type( {
	typeTest: function( fiber, v ) {
		return ! v.isTruthy();
	},
	safe: true,
	permanent: false,
} );

types.Safe = new Value.Type( {
	typeTest: function( fiber, v ) {
		return v.safe;
	},
	safe: true,
	permanent: true,
} );

types.exposes = new Value.Module( {
	Nothing: types.Nothing,
	Something: types.Something,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Bytes: types.Bytes,
	Function: types.Function,
	Type: types.Type,
	List: types.List,
	Callable: types.Callable,
	Iterable: types.Iterable,
	Truthy: types.Truthy,
	Falsy: types.Falsy,
	Safe: types.Safe,
} );
