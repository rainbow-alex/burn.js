"use strict";

module.exports = CLASS( {
	init: function( type, value ) {
		this.type = type;
		this.value = value;
	},
	toJSON: function() {
		console.assert( JSON_TYPES[ this.type ] );
		return {
			type: "token/" + JSON_TYPES[ this.type ],
			value: this.value,
			index: this.index,
			line: this.line,
			offset: this.offset,
			precedingWhitespace: this.precedingWhitespace,
			succeedingWhitespace: this.succeedingWhitespace,
		};
	},
} );

let JSON_TYPES = {
	
	newline: "newline",
	"{": "symbol/left_brace",
	"}": "symbol/right_brace",
	"(": "symbol/left_parenthesis",
	")": "symbol/right_parenthesis",
	"[": "symbol/left_bracket",
	"]": "symbol/right_bracket",
	"=": "symbol/eq",
	".": "symbol/dot",
	",": "symbol/comma",
	"->": "symbol/arrow",
	"==": "symbol/eq_eq",
	"!=": "symbol/bang_eq",
	"<": "symbol/lt",
	">": "symbol/gt",
	"<=": "symbol/lt_eq",
	">=": "symbol/gt_eq",
	"+": "symbol/plus",
	"-": "symbol/dash",
	"*": "symbol/asterisk",
	"/": "symbol/forward_slash",
	"|": "symbol/vertical_bar",
	"&": "symbol/ampersand",
	
	and: "keyword/and",
	break: "keyword/break",
	catch: "keyword/catch",
	continue: "keyword/continue",
	else: "keyword/else",
	finally: "keyword/finally",
	function: "keyword/function",
	if: "keyword/if",
	import: "keyword/import",
	include: "keyword/include",
	is: "keyword/is",
	let: "keyword/let",
	not: "keyword/not",
	or: "keyword/or",
	print: "keyword/print",
	return: "keyword/return",
	throw: "keyword/throw",
	try: "keyword/try",
	while: "keyword/while",
	
	identifier: "identifier",
	variable: "variable",
	
	nothing: "literal/nothing",
	true: "literal/boolean",
	false: "literal/boolean",
	string_literal: "literal/string",
	bytes_literal: "literal/bytes",
	integer_literal: "literal/integer",
	float_literal: "literal/float",
};
