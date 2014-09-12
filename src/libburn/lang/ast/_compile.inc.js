"use strict";
let ast = require( "./" );

function encodeVariable( v ) {
	console.assert( v[0] === "$" );
	return '$' + v.replace( /:/g, '$' );
}

function encodeName( n ) {
	return '$' + n.replace( /:/g, '$' );
}

function encodeString( s ) {
	return JSON.stringify( s );
}

function encodeBoolean( b ) {
	return b ? 'true' : 'false';
}

ast.Script.prototype.compile = function() {
	let output = { code: "", tmp: 0 };
	output.code += 'let _=require("libburn/vm/rt");';
	output.code += 'let _origin=_._origin;delete _._origin;';
	output.code += 'let _fiber=_._fiber;delete _._fiber;';
	this.statements.forEach( function( s ) {
		s.compile( output );
	} );
	return output.code;
};

ast.IfStatement.prototype.compile = function( output ) {
	output.code += 'if((';
	this.test.compile( output );
	output.code += ').isTruthy()){';
	this.block.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	this.elseIfClauses.forEach( function( c ) {
		output.code += 'else if((';
		c.test.compile( output );
		output.code += ').isTruthy()){';
		c.block.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	} );
	if( this.elseClause ) {
		output.code += 'else{';
		this.elseClause.block.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
};

ast.TryStatement.prototype.compile = function( output ) {
	let tmp = output.tmp++;
	if( this.elseClause ) {
		output.code += 'let _' + tmp + '=false;';
	}
	output.code += 'try{if(true){';
	this.block.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	if( this.elseClause ) {
		output.code += 'if(true){_' + tmp + '=true;';
		this.elseClause.block.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
	output.code += '}';
	if( this.catchClauses.length ) {
		output.code += 'catch(_e){';
		if( this.elseClause ) {
			output.code += 'if(_' + tmp + ')throw _e;';
		}
		this.catchClauses.forEach( function( c, i ) {
			if( i > 0 ) {
				output.code += 'else ';
			}
			if( c.type ) {
				output.code += 'if(_.is(_fiber,_e,';
				c.type.compile( output );
				output.code += ').isTruthy(_fiber))';
			} else {
				output.code += 'if(true)';
			}
			output.code += '{';
			output.code += 'let ' + encodeVariable( c.variable.value ) + '=_e;';
			c.block.forEach( function( s ) {
				s.compile( output );
			} );
			output.code += '}';
		} );
		output.code += 'else{throw _e;}}';
	}
	if( this.finallyClause ) {
		output.code += 'finally{';
		this.finallyClause.block.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
	if( ! this.catchClauses.length && ! this.finallyClause ) {
		output.code += 'finally{}'
	}
};

ast.WhileStatement.prototype.compile = function( output ) {
	output.code += 'while((';
	this.test.compile( output );
	output.code += ').isTruthy()){';
	this.block.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
};

ast.LetStatement.prototype.compile = function( output ) {
	output.code += 'let ' + encodeVariable( this.variable.value ) + '=';
	if( this.initialValue ) {
		this.initialValue.compile( output );
	} else {
		output.code += '_.createNothing()';
	}
	output.code += ';';
};

ast.PrintStatement.prototype.compile = function( output ) {
	output.code += 'console.log((';
	this.expression.compile( output );
	output.code += ').toBurnString(_fiber).value);';
};

ast.ReturnStatement.prototype.compile = function( output ) {
	output.code += 'return ';
	if( this.expression ) {
		this.expression.compile( output );
	}
	output.code += ';';
};

ast.ImportStatement.prototype.compile = function( output ) {
	output.code += 'let ' + encodeName( this.alias.value ) + '=' + '_.import(_fiber,[';
	this.fqn.forEach( function( p ) {
		output.code += '"' + p.value + '",';
	} );
	output.code += '],void _fiber.setLine(' + this.keyword.line + '));';
};

ast.IncludeStatement.prototype.compile = function( output ) {
	output.code += '_.include(_fiber,_origin,';
	this.expression.compile( output );
	output.code += ',void _fiber.setLine(' + this.keyword.line + '));';
};

ast.AssignmentStatement.prototype.compile = function( output ) {
	this.lvalue.compile( output );
	output.code += '=';
	this.rvalue.compile( output );
	output.code += ';';
};

ast.ExpressionStatement.prototype.compile = function( output ) {
	this.expression.compile( output );
	output.code += ';';
};

ast.AndExpression.prototype.compile = function( output ) {
	output.code += '_.and(_fiber,';
	this.left.compile( output );
	output.code += ',function(){return (';
	this.right.compile( output );
	output.code += ');})';
};

ast.OrExpression.prototype.compile = function( output ) {
	output.code += '_.or(_fiber,';
	this.left.compile( output );
	output.code += ',function(){return (';
	this.right.compile( output );
	output.code += ');})';
};

ast.NotExpression.prototype.compile = function( output ) {
	output.code += '_.not(_fiber,';
	this.expression.compile( output );
	output.code += ')';
};

ast.IsExpression.prototype.compile = function( output ) {
	output.code += '_.' + ( this.not ? 'is_not' : 'is' ) + '(_fiber,';
	this.expression.compile( output );
	output.code += ',';
	this.type.compile( output );
	output.code += ')';
};

ast.EqExpression.prototype.compile = function( output ) {
	output.code += '_.eq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.NeqExpression.prototype.compile = function( output ) {
	output.code += '_.neq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.LtExpression.prototype.compile = function( output ) {
	output.code += '_.lt(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.GtExpression.prototype.compile = function( output ) {
	output.code += '_.gt(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.LtEqExpression.prototype.compile = function( output ) {
	output.code += '_.lteq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.GtEqExpression.prototype.compile = function( output ) {
	output.code += '_.gteq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.UnionExpression.prototype.compile = function( output ) {
	output.code += '_.union(';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.AdditionExpression.prototype.compile = function( output ) {
	output.code += '_.add(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.SubtractionExpression.prototype.compile = function( output ) {
	output.code += '_.subtract(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.CallExpression.prototype.compile = function( output ) {
	output.code += '(';
	this.callee.compile( output );
	output.code += ').call(_fiber,[';
	this.arguments.forEach( function( a ) {
		a.compile( output );
		output.code += ',';
	} );
	output.code += '],void _fiber.setLine(' + this.lparen.line + '))';
};

ast.PropertyExpression.prototype.compile = function( output ) {
	output.code += '_.get(_fiber,';
	this.expression.compile( output );
	output.code += ',"' + this.property.value + '",void _fiber.setLine(' + this.dot.line + '))';
};

ast.IndexExpression.prototype.compile = function( output ) {
	output.code += '_.getIndex(_fiber,';
	this.expression.compile( output );
	output.code += ',';
	this.index.compile( output );
	output.code += ',void _fiber.setLine(' + this.lbracket.line + '))';
};

ast.FunctionExpression.prototype.compile = function( output ) {
	output.code += '_.createFunction(function(_fiber,_args){';
	this.parameters.forEach( function( a, i ) {
		output.code += 'let ' + encodeVariable(a.variable.value) + '=_args[' + i + '];';
		// TODO
	} );
	this.block.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '},{';
	if( this.name ) {
		output.code += 'name:' + encodeString( this.name ) + ',';
	}
	output.code += 'safe:' + encodeBoolean( this.safe ) + ',';
	output.code += 'origin:_origin,';
	output.code += 'line:' + this.keyword.line + ',';
	output.code += '})';
};

ast.ListLiteral.prototype.compile = function( output ) {
	output.code += '_.createList([';
	this.items.forEach( function( i ) {
		i.compile( output );
		output.code += ',';
	} );
	output.code += '])';
};

ast.ParenthesizedExpression.prototype.compile = function( output ) {
	output.code += '(';
	this.expression.compile( output );
	output.code += ')';
};

ast.IdentifierExpression.prototype.compile = function( output ) {
	if( this.magicValue ) {
		if( typeof this.magicValue === "string" ) {
			output.code += '_.createString(' + encodeString( this.magicValue ) + ')';
		} else if( typeof this.magicValue === "number" ) {
			output.code += '_.createInteger(' + this.magicValue + ')';
		} else {
			console.assert( false );
		}
	} else if( this.declared ) {
		output.code += encodeName( this.token.value );
	} else {
		output.code += '_.implicit(_fiber,"' + this.token.value + '")';
	}
};

ast.VariableExpression.prototype.compile = function( output ) {
	output.code += encodeVariable( this.token.value );
};

ast.StringLiteral.prototype.compile = function( output ) {
	output.code += '_.createString(' + this.token.value + ')'; // TODO
};

ast.IntegerLiteral.prototype.compile = function( output ) {
	output.code += '_.createInteger(' + this.token.value + ')';
};

ast.FloatLiteral.prototype.compile = function( output ) {
	output.code += '_.createFloat(' + this.token.value + ')';
};

ast.BooleanLiteral.prototype.compile = function( output ) {
	output.code += '_.createBoolean(' + this.token.type + ')';
};

ast.NothingLiteral.prototype.compile = function( output ) {
	output.code += '_.createNothing()';
};

ast.VariableLvalue.prototype.compile = function( output ) {
	output.code += encodeVariable( this.token.value );
};
