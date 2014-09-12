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
types.Module = new util.JsInstanceofType( Value.Module );

types.Type = new util.JsFunctionType( function( fiber, v ) {
	return Boolean( v.typeTest );
}, { permanent: true } );

types.Safe = new util.JsFunctionType( function( fiber, v ) {
	return v.isSafe();
}, { permanent: true } );

types.Permanent = new util.JsFunctionType( function( fiber, v ) {
	return v.isPermanent();
}, { permanent: true } );

types.Something = new util.JsFunctionType( function( fiber, v ) {
	return ! v instanceof Value.Nothing;
}, { permanent: true } );

types.Truthy = new util.JsFunctionType( function( fiber, v ) {
	return v.isTruthy();
}, { permanent: false } );

types.Falsy = new util.JsFunctionType( function( fiber, v ) {
	return ! v.isTruthy();
}, { permanent: false } );

types.Number = new util.JsFunctionType( function( fiber, v ) {
	return v instanceof Value.Integer || v instanceof Value.Float;
}, { permanent: true } );

types.exposes = new Value.Module( {
	Nothing: types.Nothing,
	Boolean: types.Boolean,
	Integer: types.Integer,
	Float: types.Float,
	String: types.String,
	Function: types.Function,
	Type: types.Type,
	Safe: types.Safe,
	Permanent: types.Permanent,
	Something: types.Something,
	Truthy: types.Truthy,
	Falsy: types.Falsy,
	Number: types.Number,
} );
