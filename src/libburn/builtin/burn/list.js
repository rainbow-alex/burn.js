"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );
let types = require( "libburn/builtin/burn/types" );

let list = module.exports;

list.JsListInstance = CLASS( Value.Special, {
	init: function( items ) {
		this.items = items;
	},
	repr: "<List>",
	isTruthy: function() {
		return this.items.length !== 0;
	},
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, this, types.Integer, index );
		return this.items[ index.value ];
	},
	get_length: function( fiber ) {
		return new Value.Integer( this.items.length );
	},
	call_push: function( fiber, args ) {
		util.validateMethodCallArguments( fiber, this, "push", [ { type: types.Integer } ], args );
		this.items.push( args[0] );
	},
} );

list.List = new util.JsInstanceofType( list.JsListInstance );

list.exposes = new Value.Module( {
	List: list.List,
} );
