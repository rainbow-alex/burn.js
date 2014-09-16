"use strict";
let Token = require( "./Token" );
let Error = require( "./Error" );
let utf8 = require( "../utf8" );

module.exports = function( origin ) {
	
	let bytes = origin.sourceCode;
	let source;
	
	try {
		source = utf8.decode( bytes );
	} catch( e ) {
		throw new Error( "Not valid utf-8: " + e.message, origin );
	}
	
	let tokens = [];
	
	let i = 0;
	let line = 1;
	let offset = 0;
	
	let ignoreNewlinesStack = [];
	let ignoreNewlines = false;
	
	let previousToken = "";
	let whitespace = "";
	
	function pushToken( type, value ) {
		
		if( previousToken ) {
			previousToken.succeedingWhitespace = whitespace;
		}
		
		let token = new Token( type, value );
		token.origin = origin;
		token.line = line;
		token.offset = offset;
		
		token.precedingWhitespace = whitespace;
		previousToken = token;
		whitespace = "";
		
		tokens.push( token );
	}
	
	while( i < source.length ) {
		
		let m;
		
		// whitespace
		if( m = source.substr(i).match( /^[ \t]+/  ) ) {
			whitespace += m[0];
		
		// comments
		} else if( m = source.substr(i).match( /^\/(\*+)(.|\n)*?([^*]\1\/|$)/ ) ) {
			whitespace += m[0];
		} else if( m = source.substr(i).match( /^\/\/.*?(?=\n|$)/ ) ) {
			whitespace += m[0];
		
		// newline
		} else if( m = source.substr(i).match( /^\n/ ) ) {
			if( ignoreNewlines || ! previousToken || [ "newline", "{" ].indexOf( previousToken.type ) !== -1 ) {
				whitespace += m[0];
			} else {
				pushToken( "newline", m[0] );
			}
		
		// braces, parentheses and brackets
		} else if( m = source.substr(i).match( /^{/ ) ) {
			pushToken( m[0], m[0] );
			ignoreNewlinesStack.push( ignoreNewlines );
			ignoreNewlines = false;
		} else if( m = source.substr(i).match( /^(\(|\[)/ ) ) {
			pushToken( m[0], m[0] );
			ignoreNewlinesStack.push( ignoreNewlines );
			ignoreNewlines = true;
		} else if( m = source.substr(i).match( /^(}|\)|])/ ) ) {
			pushToken( m[0], m[0] );
			ignoreNewlines = ignoreNewlinesStack.pop();
		
		// symbols
		} else if( m = source.substr(i).match( /^(==|!=|<=|>=|->)/ ) ) {
			pushToken( m[0], m[0] );
		} else if( m = source.substr(i).match( /^(,|<|>|\||=|\+|\*|\/|\.)/ ) ) {
			pushToken( m[0], m[0] );
		// - matched below, after number literals
		
		// keywords
		} else if( m = source.substr(i).match(
			/^(and|break|catch|class|continue|else|false|finally|for|function|if|import|in|include|is|let|not|nothing|or|print|return|this|throw|true|try|while)\b/
		) ) {
			pushToken( m[0], m[0] );
		
		// identifiers
		} else if( m = source.substr(i).match( /^[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /^:|::|:$/ ) ) {
				throw new Error( "Invalid identifier.", origin, line, offset );
			}
			pushToken( "identifier", m[0] );
		
		// variables
		} else if( m = source.substr(i).match( /^\$[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /::|:$/ ) ) {
				throw new Error( "Invalid variable.", origin, line, offset );
			}
			pushToken( "variable", m[0] );
		} else if( m = source.substr(i).match( /^\$/ ) ) {
			throw new Error( "Invalid variable.", origin, line, offset );
		
		// number literals
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)\.[0-9]+/ ) ) {
			pushToken( "float_literal", m[0] );
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)/ ) ) {
			pushToken( "integer_literal", m[0] );
		
		// symbols (2)
		} else if( m = source.substr(i).match( /^(-)/ ) ) {
			pushToken( m[0], m[0] );
		
		// string literals
		} else if( m = source.substr(i).match( /^"([^\\"]|\\.)*"/ ) ) {
			pushToken( "string_literal", m[0] );
		
		} else {
			throw new Error( "Unexpected input.", origin, line, offset );
		}
		
		if( m[0].indexOf( "\n" ) !== -1 ) {
			line += m[0].match( /\n/g ).length;
			offset = m[0].match( /\n([^\n]*)$/ )[1].length;
		} else {
			offset += m[0].length;
		}
		
		i += m[0].length;
	}
	
	if( previousToken ) {
		previousToken.succeedingWhitespace = whitespace;
	}
	
	return tokens;
};
