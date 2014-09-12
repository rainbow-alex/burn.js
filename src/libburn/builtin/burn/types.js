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

types.Type = new util.JsFunctionType( function( fiber, v ) {
	return Boolean( v.typeTest );
} );

types.Safe = new util.JsFunctionType( function( fiber, v ) {
	return v.isSafe();
} );

types.Anything = new util.JsFunctionType( function( fiber, v ) {
	return ! v instanceof Value.Nothing;
} );

types.Truthy = new util.JsFunctionType( function( fiber, v ) {
	return v.isTruthy();
} );

types.Falsy = new util.JsFunctionType( function( fiber, v ) {
	return ! v.isTruthy();
} );

types.Number = new util.JsFunctionType( function( fiber, v ) {
	return v instanceof Value.Integer || v instanceof Value.Float;
} );

types.exposes = new Value.Module( {
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Type: types.Type,
	Safe: types.Safe,
	Anything: types.Anything,
	Truthy: types.Truthy,
	Falsy: types.Falsy,
	Number: types.Number,
} );
