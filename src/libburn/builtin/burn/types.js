"use strict";
let vm = require( "libburn/vm" );
let JsInstanceofType = vm.helpers.JsInstanceofType;

let types = module.exports;

types.Nothing = new JsInstanceofType( vm.Nothing );
types.Boolean = new JsInstanceofType( vm.Boolean );
types.Integer = new JsInstanceofType( vm.Integer );
types.Float = new JsInstanceofType( vm.Float );
types.String = new JsInstanceofType( vm.String );
types.Function = new JsInstanceofType( vm.Function );

types.Type = new ( CLASS( vm.Special, {
	repr: "Type",
	typeTest: function( fiber, v ) {
		if( v instanceof vm.Special && v.typeTest ) {
			return true;
		} else {
			return false;
		}
	},
} ) )();

types.Anything = new ( CLASS( vm.Special, {
	typeTest: function( fiber, v ) {
		return ! v instanceof vm.Nothing;
	},
} ) )();

types.Truthy = new ( CLASS( vm.Special, {
	typeTest: function( fiber, v ) {
		return v.isTruthy();
	},
} ) )();

types.Falsy = new ( CLASS( vm.Special, {
	typeTest: function( fiber, v ) {
		return ! v.isTruthy();
	},
} ) )();

types.Number = new ( CLASS( vm.Special, {
	repr: "Number",
	typeTest: function( fiber, v ) {
		return v instanceof vm.Integer || v instanceof vm.Float;
	},
} ) )();

types.exposes = new vm.Module( {
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
