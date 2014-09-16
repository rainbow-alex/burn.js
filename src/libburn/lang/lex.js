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
			tokens.push( new Token( "newline", null, origin, line, offset ) );
		
		// symbols
		} else if( m = source.substr(i).match( /^(==|!=|<=|>=|->)/ ) ) {
			tokens.push( new Token( m[0], null, origin, line, offset ) );
		} else if( m = source.substr(i).match( /^({|}|\(|\)|,|<|>|\||=|\+|\*|\/|\.|\[|\])/ ) ) {
			tokens.push( new Token( m[0], null, origin, line, offset ) );
		
		// keywords
		} else if( m = source.substr(i).match(
			/^(and|break|catch|class|continue|else|false|finally|for|function|if|import|in|include|is|let|not|nothing|or|print|return|this|throw|true|try|while)\b/
		) ) {
			tokens.push( new Token( m[0], null, origin, line, offset ) );
		
		// identifiers
		} else if( m = source.substr(i).match( /^[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /^:|::|:$/ ) ) {
				throw new Error( "Invalid identifier.", origin, line, offset );
			}
			tokens.push( new Token( "identifier", m[0], origin, line, offset ) );
		
		// variables
		} else if( m = source.substr(i).match( /^\$[A-Za-z_][A-Za-z0-9_:]*/ ) ) {
			if( m[0].match( /::|:$/ ) ) {
				throw new Error( "Invalid variable.", origin, line, offset );
			}
			tokens.push( new Token( "variable", m[0], origin, line, offset ) );
		} else if( m = source.substr(i).match( /^\$/ ) ) {
			throw new Error( "Invalid variable.", origin, line, offset );
		
		// number literals
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)\.[0-9]+/ ) ) {
			tokens.push( new Token( "float_literal", m[0], origin, line, offset ) );
		} else if( m = source.substr(i).match( /^-?(0|[1-9][0-9]*)/ ) ) {
			tokens.push( new Token( "integer_literal", m[0], origin, line, offset ) );
		
		// symbols (2)
		} else if( m = source.substr(i).match( /^(-)/ ) ) {
			tokens.push( new Token( m[0], null, origin, line, offset ) );
		
		// string literals
		} else if( m = source.substr(i).match( /^"([^\\"]|\\.)*"/ ) ) {
			tokens.push( new Token( "string_literal", m[0], origin, line, offset ) );
		
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
	
	return tokens;
};
