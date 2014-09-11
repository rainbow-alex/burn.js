"use strict";
let Error = require( "../Error" );
let ast = require( "./" );

ast.Node.prototype.lint = function() {
	for( let k in this ) {
		if( this.hasOwnProperty( k ) ) {
			if( Array.isArray( this[k] ) ) {
				this[k].forEach( function( i ) {
					if( i instanceof ast.Node ) {
						i.lint();
					}
				} );
			} else if( this[k] instanceof ast.Node ) {
				this[k].lint();
			}
		}
	}
};

ast.OrExpression.prototype.lint = function() {
	if( this.left instanceof ast.AndExpression ) {
		throw new Error(
			"Add parentheses to make `and`/`or` precedence explicit.",
			this.left.operator
		);
	}
	if( this.right instanceof ast.AndExpression ) {
		throw new Error(
			"Add parentheses to make `or`/`and` precedence explicit.",
			this.operator
		);
	}
	if( this.left instanceof ast.NotExpression ) {
		throw new Error(
			"Add parentheses to make `not`/`or` precedence explicit.",
			this.left.operator
		);
	}
	ast.Node.prototype.lint.call( this );
};

ast.AndExpression.prototype.lint = function() {
	if( this.left instanceof ast.NotExpression ) {
		throw new Error(
			"Add parentheses to make `not`/`and` precedence explicit.",
			this.left.operator
		);
	}
	ast.Node.prototype.lint.call( this );
};

ast.NotExpression.prototype.lint = function() {
	if( this.expression instanceof ast.IsExpression ) {
		throw new Error(
			"Use `... is not ...` instead of `not ... is ...`.",
			this.operator
		);
	}
	ast.Node.prototype.lint.call( this );
};
