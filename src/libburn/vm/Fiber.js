"use strict";

let Fiber = module.exports = CLASS( {
	init: function( vm ) {
		this.vm = vm;
		this.stack = [];
	},
	setLine: function( line ) {
		this.stack[ this.stack.length - 1 ].line = line;
	},
} );

Fiber.Frame = CLASS();

Fiber.RootFrame = CLASS( Fiber.Frame, {
	init: function( origin ) {
		this.origin = origin;
	},
} );

Fiber.FunctionFrame = CLASS( Fiber.Frame, {
	init: function( function_ ) {
		this.function_ = function_;
	},
} );

Fiber.BoundMethodFrame = CLASS( Fiber.Frame, {
	init: function( boundMethod ) {
		this.boundMethod = boundMethod;
	},
} );

Fiber.ImportFrame = CLASS( Fiber.Frame, {
	init: function( origin, line ) {
		this.origin = origin;
		this.line = line;
	},
} );

Fiber.IncludeFrame = CLASS( Fiber.Frame, {
	init: function( origin, line ) {
		this.origin = origin;
		this.line = line;
	},
} );
