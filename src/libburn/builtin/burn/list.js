"use strict";
let vm = require( "libburn/vm" );
let JsInstanceofType = vm.helpers.JsInstanceofType;

let list = module.exports;

list.JsListInstance = CLASS( vm.Special, {
	init: function( items ) {
		this.items = items;
	},
	getProperty_length: function( fiber ) {
		return new vm.Integer( this.items.length );
	},
	callMethod_push: function( fiber, args ) {
		this.items.push( args[0] );
	},
} );

list.exposes = new vm.Module( {
	JsList: new JsInstanceofType( list.JsListInstance ),
	List: new JsInstanceofType( list.JsListInstance ), // TODO other types should be able to be a List
} );
