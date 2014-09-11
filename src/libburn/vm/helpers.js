"use strict";
let vm = require( "./" );

exports.JsInstanceofType = CLASS( vm.Special, {
	init: function( constructor ) {
		this.constructor = constructor;
	},
	suggestName: function( name ) {
		this.repr = this.repr || name;
	},
	typeTest: function( fiber, v ) {
		return v instanceof this.constructor;
	},
} );
