"use strict";
let vm = require( "libburn/vm" );
let helpers = vm.helpers;
let types = require( "libburn/builtin/burn/types" );

let list = module.exports;

list.JsListInstance = CLASS( vm.Special, {
	init: function( items ) {
		this.items = items;
	},
	repr: "<List>",
	getProperty_length: function( fiber ) {
		return new vm.Integer( this.items.length );
	},
	"callMethod_magic:index": function( fiber, args ) {
		helpers.validateArguments( fiber, [ types.Integer ], args );
		return this.items[ args[0].value ];
	},
	callMethod_push: function( fiber, args ) {
		helpers.validateArguments( fiber, [ {} ], args );
		this.items.push( args[0] );
	},
} );

list.List = new helpers.JsInstanceofType( list.JsListInstance ); // TODO other types should be able to be a List

list.exposes = new vm.Module( {
	List: list.List,
} );
