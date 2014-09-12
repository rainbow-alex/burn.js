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
	get_length: function( fiber ) {
		return new Value.Integer( this.items.length );
	},
	getIndex: function( fiber, index ) {
		util.validateIndex( fiber, types.Integer, index );
		return this.items[ args[0].value ];
	},
	call_push: function( fiber, args ) {
		util.validateArguments( fiber, [ {} ], args );
		this.items.push( args[0] );
	},
} );

list.List = new util.JsInstanceofType( list.JsListInstance ); // TODO other types should be able to be a List

list.exposes = new Value.Module( {
	List: list.List,
} );
