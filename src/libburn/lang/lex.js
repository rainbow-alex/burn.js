"use strict";
let Error = require( "./Error" );

module.exports = function( origin ) {
	
	let source = origin.sourceCode;
	
	let tokens = [];
	let i = 0;
	let line = 1;
	let offset = 0;
	
	while( i < source.length ) {
		
		let m;
		
		// whitespace
		if( m = source.substr(i).match( /^[ \t]+/  ) ) {
			// pass
		
		// comments
		} else if( m = source.substr(i).match( /^\/(\*+)(.|\n)*?([^*]\1\/|$)/ ) ) {
			// pass
		} else if( m = source.substr(i).match( /^\/\/.*?(?=\n|$)/ ) ) {
			// pass
		
		// newline
		} else if( m = source.substr(i).match( /^\n/ ) ) {
			tokens.push( { origin: origin, type: "newline", line: line, offset: offset } );
		
		// symbols
		} else if( m = source.substr(i).match( /^(==|!=|<=|>=)/ ) ) {
			tokens.push( { origin: origin, type: m[0], line: line, offset: offset } );
		} else if( m = source.substr(i).match( /^({|}|\(|\)|,|<|>|\||=|\+|\*|\/|\.|\[|\])/ ) ) {
			tokens.push( { origin: origin, type: m[0], line: line, offset: offset } );
		
		// keywords
		} else if( m = source.substr(i).match(
			/^(and|break|catch|class|continue|else|false|finally|for|function|if|import|in|include|is|let|not|nothing|or|print|return|this|throw|true|try|while)\b/
		) ) {
			tokens.push( { origin: origin, type: m[0], line: line, offset: offset } );
		
		// identifiers
		} else if( m = source.substr(i).match( /^[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /^:|::|:$/ ) ) {
				throw new Error( "Invalid identifier.", origin, line, offset );
			}
			tokens.push( { origin: origin, type: "identifier", value: m[0], line: line, offset: offset } );
		
		// variables
		} else if( m = source.substr(i).match( /^\$[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /::|:$/ ) ) {
				throw new Error( "Invalid variable.", origin, line, offset );
			}
			tokens.push( { origin: origin, type: "variable", value: m[0], line: line, offset: offset } );
		} else if( m = source.substr(i).match( /^\$/ ) ) {
			throw new Error( "Invalid variable.", origin, line, offset );
		
		// number literals
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)\.[0-9]+/ ) ) {
			tokens.push( { origin: origin, type: "float_literal", value: m[0], line: line, offset: offset } );
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)/ ) ) {
			tokens.push( { origin: origin, type: "integer_literal", value: m[0], line: line, offset: offset } );
		
		// symbols (2)
		} else if( m = source.substr(i).match( /^(-)/ ) ) {
			tokens.push( { origin: origin, type: m[0], line: line, offset: offset } );
		
		// string literals
		} else if( m = source.substr(i).match( /^"(\\.|[^\\"])*"/ ) ) {
			tokens.push( { origin: origin, type: "string_literal", value: m[0], line: line, offset: offset } );
		
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
	
	tokens.push( { origin: origin, type: "newline", line: line, offset: offset } );
	
	return tokens;
};
