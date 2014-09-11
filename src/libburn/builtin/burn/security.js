"use strict";
let vm = require( "libburn/vm" );
let JsInstanceofType = vm.helpers.JsInstanceofType;

let security = module.exports;

security.KeyInstance = CLASS( vm.Special, {
	init: function( id ) {
		this.id = id;
	},
} );
security.Key = new JsInstanceofType( security.KeyInstance );

security.exposes = new vm.Module( {
	Key: security.Key,
} );


