"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let types = module.exports;

types.Nothing = new util.JsInstanceofType( Value.Nothing );
types.Boolean = new util.JsInstanceofType( Value.Boolean );
types.Integer = new util.JsInstanceofType( Value.Integer );
types.Float = new util.JsInstanceofType( Value.Float );
types.String = new util.JsInstanceofType( Value.String );
types.Function = new util.JsInstanceofType( Value.Function );

types.Type = new ( CLASS( Value.Special, {
	repr: "Type",
	typeTest: function( fiber, v ) {
		if( v instanceof Value.Special && v.typeTest ) {
			return true;
		} else {
			return false;
		}
	},
} ) )();

types.Anything = new ( CLASS( Value.Special, {
	typeTest: function( fiber, v ) {
		return ! v instanceof Value.Nothing;
	},
} ) )();

types.Truthy = new ( CLASS( Value.Special, {
	typeTest: function( fiber, v ) {
		return v.isTruthy();
	},
} ) )();

types.Falsy = new ( CLASS( Value.Special, {
	typeTest: function( fiber, v ) {
		return ! v.isTruthy();
	},
} ) )();

types.Number = new ( CLASS( Value.Special, {
	repr: "Number",
	typeTest: function( fiber, v ) {
		return v instanceof Value.Integer || v instanceof Value.Float;
	},
} ) )();

types.exposes = new Value.Module( {
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Type: types.Type,
	Anything: types.Anything,
	Truthy: types.Truthy,
	Falsy: types.Falsy,
	Number: types.Number,
} );
