"use strict";
let Value = require( "libburn/vm/Value" );
let util = require( "libburn/vm/util" );

let Process = module.exports;

Process.ProcessInstance = CLASS( Value.Special, {
	repr: "<Process>",
} );
Process.Process = new util.JsInstanceofType( Process.ProcessInstance )

Process.exposes = Process.Process;
