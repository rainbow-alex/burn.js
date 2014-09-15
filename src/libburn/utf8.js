"use strict";

let utf8 = module.exports;

function DecodeError( m ) {
	console.assert( this instanceof DecodeError );
	this.message = m;
}
DecodeError.prototype = new Error;

function b( s ) {
	return parseInt( s.replace( / /g, "" ), 2 );
}

function fromCodePoint( p ) {
	// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	if( p > 0xFFFF ) {
		let h = Math.floor( ( p - 0x10000 ) / 0x400 ) + 0xD800;
		let l = ( p - 0x10000 ) % 0x400 + 0xDC00;
		return String.fromCharCode( h ) + String.fromCharCode( l );
	} else {
		return String.fromCharCode( p );
	}
}

utf8.decode = function( bytes ) {
	
	let decoded = "";
	
	for( let i = 0 ; i < bytes.length ; i++ ) {
		let byte = bytes[i];
		
		// leading 0 -> one-octet character
		if( ( byte & b( "1000 0000" ) ) === b( "0000 0000" ) ) {
			decoded += fromCodePoint( byte );
		
		// multi-octet sequence
		} else {
			
			// first, find the supposed number of bytes in the sequence
			// then keep only character value bits
			let sequenceLength;
			if( ( byte & b( "1110 0000" ) ) === b( "1100 0000" ) ) {
				sequenceLength = 2;
				byte = byte & b( "0001 1111" );
			
			} else if( ( byte & b( "1111 0000" ) ) === b( "1110 0000" ) ) {
				sequenceLength = 3;
				byte = byte & b( "0000 1111" );
			
			} else if( ( byte & b( "1111 1000" ) ) === b( "1111 0000" ) ) {
				sequenceLength = 4;
				byte = byte & b( "0000 0111" );
			
			} else if( ( byte & b( "1111 1100" ) ) === b( "1111 1000" ) ) {
				sequenceLength = 5;
				byte = byte & b( "0000 0011" );
			
			} else if( ( byte & b( "1111 1110" ) ) === b( "1111 1100" ) ) {
				sequenceLength = 6;
				byte = byte & b( "0000 0001" );
			
			} else if( ( byte & b( "1100 0000" ) ) === b( "1000 0000" ) ) {
				throw new DecodeError( "Unexpected continuation byte." );
			
			} else {
				throw new DecodeError( "Illegal codepoint." );
			}
			
			let remaining = sequenceLength - 1;
			
			// shift the character value bits we have in place
			let codepoint = byte << ( remaining * 6 );
			
			// read continuation bytes
			while( remaining ) {
				i++;
				
				if( i >= bytes.length ) {
					throw new DecodeError( "Continuation bytes missing." );
				}
				
				let byte = bytes[i];
				
				// a continuation byte should start with 10
				if( ( byte & b( "1100 0000" ) ) !== b( "1000 0000" ) ) {
					throw new DecodeError( "Continuation bytes missing." );
				}
				
				byte = byte & b( "0011 1111" );
				
				remaining--;
				codepoint += byte << ( remaining * 6 );
			}
			
			// check if the encoding wasn't "overlong"
			// http://stackoverflow.com/a/7399922
			if( codepoint <= 0x007F ) {
				if( sequenceLength > 1 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			} else if( codepoint <= 0x07FF ) {
				if( sequenceLength > 2 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			} else if( codepoint <= 0xFFFF ) {
				if( sequenceLength > 3 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			} else if( codepoint <= 0x1FFFFF ) {
				if( sequenceLength > 4 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			} else if( codepoint <= 0x3FFFFFF ) {
				if( sequenceLength > 5 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			} else if( codepoint <= 0x7FFFFFFF ) {
				if( sequenceLength > 6 ) {
					throw new DecodeError( "Overlong sequence." );
				}
			}
			
			if( codepoint > 0x10FFFF ) {
				throw new DecodeError( "Illegal codepoint." );
			}
			
			// http://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B0000_to_U.2BD7FF_and_U.2BE000_to_U.2BFFFF
			if( 0xD800 <= codepoint && codepoint <= 0xDFFF ) {
				throw new DecodeError( "Illegal codepoint." );
			}
			
			decoded += fromCodePoint( codepoint );
		}
	}
	
	return decoded;
};
