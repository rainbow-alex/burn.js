"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let security = module.exports;

security.KeyInstance = CLASS( Value.Special, {
	init: function( id ) {
		this.id = id;
	},
} );
security.Key = new util.JsInstanceofType( security.KeyInstance );

security.exposes = new Value.Module( {
	Key: security.Key,
} );


