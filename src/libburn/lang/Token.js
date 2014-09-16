"use strict";

module.exports = CLASS( {
	init: function( type, value ) {
		this.type = type;
		this.value = value;
	},
	toJSON: function() {
		return {
			type: "token:" + this.type,
			value: this.value,
			offset: this.offset,
			line: this.line,
			precedingWhitespace: this.precedingWhitespace,
			succeedingWhitespace: this.succeedingWhitespace,
		};
	},
} );
