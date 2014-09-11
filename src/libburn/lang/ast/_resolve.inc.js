"use strict";
let path = require( "path" );
let Error = require( "../Error" );
let ast = require( "./" );

let Scope = CLASS( {
	declareName: function( name ) {
		this[ "n:" + name ] = true;
	},
	declareVariable: function( name ) {
		this[ "v:" + name ] = true;
	},
	isNameDeclared: function( name ) {
		return Boolean( this[ "n:" + name ] );
	},
	isVariableDeclared: function( name ) {
		return Boolean( this[ "v:" + name ] );
	},
	isVariableDeclaredInThisScope: function( name ) {
		return this.hasOwnProperty( "v:" + name );
	},
	createNested: function() {
		return Object.create( this );
	},
} );

ast.Node.prototype.resolve = function( scope ) {
	for( let k in this ) {
		if( this.hasOwnProperty( k ) ) {
			if( Array.isArray( this[k] ) ) {
				this[k].forEach( function( i ) {
					if( i instanceof ast.Node ) {
						i.resolve( scope );
					}
				} );
			} else if( this[k] instanceof ast.Node ) {
				this[k].resolve( scope );
			}
		}
	}
};

ast.Script.prototype.resolve = function() {
	let scope = new Scope();
	this.statements.forEach( function( s ) {
		s.resolve( scope );
	} );
};

ast.IfStatement.prototype.resolve = function( scope ) {
	this.test.resolve( scope );
	let blockScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
	this.elseIfClauses.forEach( function( c ) {
		c.resolve( scope );
	} );
	if( this.elseClause ) {
		this.elseClause.resolve( scope );
	}
};

ast.TryStatement.prototype.resolve = function( scope ) {
	let tryScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( tryScope );
	} );
	this.catchClauses.forEach( function( c, i ) {
		c.resolve( scope );
	} );
	if( this.elseClause ) {
		this.elseClause.resolve( scope );
	}
	if( this.finallyClause ) {
		this.finallyClause.resolve( scope );
	}
};

ast.WhileStatement.prototype.resolve = function( scope ) {
	this.test.resolve( scope );
	let blockScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
};

ast.LetStatement.prototype.resolve = function( scope ) {
	if( scope.isVariableDeclaredInThisScope( this.variable.value ) ) {
		throw new Error( "Duplicate declaration of " + this.variable.value + ".", this.variable );
	}
	scope.declareVariable( this.variable.value );
	ast.Node.prototype.resolve.call( this, scope );
	if( this.initialValue instanceof ast.FunctionExpression ) {
		this.initialValue.name = this.variable.value;
	}
};

ast.ImportStatement.prototype.resolve = function( scope ) {
	scope.declareName( this.alias.value );
};

ast.AssignmentStatement.prototype.resolve = function( scope ) {
	ast.Node.prototype.resolve.call( this, scope );
	if( this.rvalue instanceof ast.FunctionExpression ) {
		this.rvalue.name = this.lvalue.suggestName();
	}
};

ast.ElseIfClause.prototype.resolve = function( scope ) {
	this.test.resolve( scope );
	let blockScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
};

ast.ElseClause.prototype.resolve = function( scope ) {
	let blockScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
};

ast.CatchClause.prototype.resolve = function( scope ) {
	if( this.type ) {
		this.type.resolve( scope );
	}
	let blockScope = scope.createNested();
	blockScope.declareVariable( this.variable.value );
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
};

ast.FinallyClause.prototype.resolve = function( scope ) {
	let blockScope = scope.createNested();
	this.block.forEach( function( s ) {
		s.resolve( blockScope );
	} );
};

ast.FunctionExpression.prototype.resolve = function( scope ) {
	let functionScope = scope.createNested();
	this.parameters.forEach( function( p ) {
		p.resolve( functionScope );
	} );
	this.block.forEach( function( s ) {
		s.resolve( functionScope );
	} );
};

ast.FunctionParameter.prototype.resolve = function( scope ) {
	if( scope.isVariableDeclaredInThisScope( this.variable.value ) ) {
		throw new Error( "Duplicate declaration of " + this.variable.value, this.variable );
	}
	scope.declareVariable( this.variable.value );
	if( this.defaultValue ) {
		this.defaultValue.resolve( scope );
	}
};

ast.IdentifierExpression.prototype.resolve = function( scope ) {
	if( this.token.value === "magic:filename" && this.token.origin.filename ) {
		this.magicValue = path.resolve( this.token.origin.filename );
	} else if( this.token.value === "magic:dirname" && this.token.origin.filename ) {
		this.magicValue = path.dirname( path.resolve( this.token.origin.filename ) );
	} else if( this.token.value === "magic:line" ) {
		this.magicValue = this.token.line;
	} else {
		this.declared = scope.isNameDeclared( this.token.value );
	}
};

ast.VariableExpression.prototype.resolve = function( scope ) {
	if( ! scope.isVariableDeclared( this.token.value ) ) {
		throw new Error( "Variable " + this.token.value + " not found.", this.token );
	}
};

ast.VariableLvalue.prototype.resolve = function( scope ) {
	if( ! scope.isVariableDeclared( this.token.value ) ) {
		throw new Error( "Variable " + this.token.value + " not found.", this.token );
	}
};

ast.VariableLvalue.prototype.suggestName = function() {
	return this.token.value.substr(1);
};
