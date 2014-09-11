"use strict";
let vm = require( "libburn/vm" );
let JsInstanceofType = vm.helpers.JsInstanceofType;

let Process = module.exports;

Process.ProcessInstance = CLASS( vm.Special, {
	repr: "<Process>",
} );
Process.Process = new JsInstanceofType( Process.ProcessInstance )

Process.exposes = Process.Process;
