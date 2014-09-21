"use strict";

module.exports = CLASS( {
	init: function() {
		this._contents = [];
	},
	pushValue: function( value ) {
		console.assert( this._contents.length % 2 === 0 );
		this._contents.push( value );
	},
	pushSeparator: function( separator ) {
		console.assert( this._contents.length % 2 === 1 );
		this._contents.push( separator );
	},
	getLastValue: function() {
		console.assert( this._contents.length );
		if( this._contents.length % 2 === 0 ) {
			return this._contents[ this._contents.length - 2 ];
		} else {
			return this._contents[ this._contents.length - 1 ];
		}
	},
	forEachValue: function( f ) {
		for( let i = 0 ; i < this._contents.length ; i += 2 ) {
			f( this._contents[i], i/2 );
		}
	},
	forEachValueOrSeparator: function( f ) {
		for( let i = 0 ; i < this._contents.length ; i++ ) {
			f( this._contents[i], i );
		}
	},
	countValues: function() {
		if( this._contents.length % 2 === 0 ) {
			return this._contents.length / 2;
		} else {
			return ( this._contents.length + 1 ) / 2;
		}
	},
	toJSON: function() {
		return this._contents;
	},
} );
