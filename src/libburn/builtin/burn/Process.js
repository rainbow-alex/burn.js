"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );
let types = require( "libburn/builtin/burn/types" );

let Process = module.exports;

Process.ProcessInstance = CLASS( Value.Special, {
	init: function( argv ) {
		this.argv = argv;
	},
	repr: "<Process>",
	get_pid: function( fiber ) {
		return new Value.Integer( process.pid );
	},
	get_argv: function() {
		if( Array.isArray( this.argv ) ) {
			this.argv = new Value.List( this.argv.map( util.toValue ) );
		}
		return this.argv;
	},
	call_exit: function( fiber, callee, args ) {
		util.validateCallArguments( fiber, callee, args, [
			{ type: types.Integer, default: 0 },
		] );
		process.exit( args[0].value );
	},
} );
Process.Process = new util.JsInstanceofType( Process.ProcessInstance )

Process.exposes = Process.Process;
