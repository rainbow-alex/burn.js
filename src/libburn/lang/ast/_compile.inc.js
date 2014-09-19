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

let OutputHelper = CLASS( {
	init: function() {
		this.code = "";
		this.tmp = 0;
	},
	createTemporaryVariable: function() {
		return "_" + ++this.tmp;
	},
} );

ast.Root.prototype.compile = function() {
	let output = new OutputHelper();
	output.code += 'let _=require("libburn/vm/rt");';
	output.code += 'let _origin=_._origin;delete _._origin;';
	output.code += 'let _fiber=_._fiber;delete _._fiber;';
	this.statements.forEach( function( s ) {
		s.compile( output );
	} );
	return output.code;
};

ast.BreakStatement.prototype.compile = function( output ) {
	if( this.loop.elseClause ) {
		output.code += this.loop._breakFlag + '=true;';
	}
	if( this.label ) {
		output.code += 'break ' + this.label.value.substr(1) + ';';
	} else {
		output.code += 'break;';
	}
};

ast.ContinueStatement.prototype.compile = function( output ) {
	if( this.label ) {
		output.code += 'continue ' + this.label.value.substr(1) + ';';
	} else {
		output.code += 'continue;';
	}
};

ast.ForInStatement.prototype.compile = function( output ) {
	if( this.elseClause ) {
		this._breakFlag = output.createTemporaryVariable();
		output.code += 'let ' + this._breakFlag + '=false;';
	}
	let iteratorVar = output.createTemporaryVariable();
	let loopVar = output.createTemporaryVariable();
	output.code += 'let ' + iteratorVar + '=_.forInIter(_fiber,';
	this.iterator.compile( output );
	output.code += ');';
	output.code += 'let ' + loopVar + ';';
	if( this.label ) {
		output.code += this.label.value.substr(1) + ':';
	}
	output.code += 'while(' + loopVar + '=' + iteratorVar + '()){';
	output.code += 'let ' + encodeVariable( this.variable.value ) + '=' + loopVar + ';';
	this.block.statements.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	if( this.elseClause ) {
		output.code += 'if(' + this._breakFlag + '){';
		this.elseClause.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
};

ast.IfStatement.prototype.compile = function( output ) {
	output.code += 'if((';
	this.test.compile( output );
	output.code += ').isTruthy()){';
	this.block.statements.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	this.elseIfClauses.forEach( function( c ) {
		output.code += 'else if((';
		c.test.compile( output );
		output.code += ').isTruthy()){';
		c.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	} );
	if( this.elseClause ) {
		output.code += 'else{';
		this.elseClause.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
};

ast.ImportStatement.prototype.compile = function( output ) {
	let alias = this.fqn.getLastValue();
	output.code += 'let ' + encodeName( alias.value ) + '=' + '_.import(_fiber,[';
	this.fqn.forEachValue( function( p ) {
		output.code += '"' + p.value + '",';
	} );
	output.code += '],void _fiber.setLine(' + this.keyword.line + '));';
};

ast.IncludeStatement.prototype.compile = function( output ) {
	output.code += '_.include(_fiber,_origin,';
	this.expression.compile( output );
	output.code += ',void _fiber.setLine(' + this.keyword.line + '));';
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

ast.ThrowStatement.prototype.compile = function( output ) {
	output.code += 'throw ';
	this.expression.compile( output );
	output.code += ';';
};

ast.TryStatement.prototype.compile = function( output ) {
	let tmp = output.createTemporaryVariable();
	if( this.elseClause ) {
		output.code += 'let ' + tmp + '=false;';
	}
	output.code += 'try{if(true){';
	this.block.statements.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	if( this.elseClause ) {
		output.code += 'if(true){' + tmp + '=true;';
		this.elseClause.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
	output.code += '}';
	if( this.catchClauses.length ) {
		output.code += 'catch(_e){';
		if( this.elseClause ) {
			output.code += 'if(' + tmp + ')throw _e;';
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
			c.block.statements.forEach( function( s ) {
				s.compile( output );
			} );
			output.code += '}';
		} );
		output.code += 'else{throw _e;}}';
	}
	if( this.finallyClause ) {
		output.code += 'finally{';
		this.finallyClause.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
	if( ! this.catchClauses.length && ! this.finallyClause ) {
		output.code += 'finally{}'
	}
};

ast.WhileStatement.prototype.compile = function( output ) {
	if( this.elseClause ) {
		this._breakFlag = output.createTemporaryVariable();
		output.code += 'let ' + this._breakFlag + '=false;';
	}
	if( this.label ) {
		output.code += this.label.value.substr(1) + ':';
	}
	output.code += 'while((';
	this.test.compile( output );
	output.code += ').isTruthy()){';
	this.block.statements.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}';
	if( this.elseClause ) {
		output.code += 'if(' + this._breakFlag + '){';
		this.elseClause.block.statements.forEach( function( s ) {
			s.compile( output );
		} );
		output.code += '}';
	}
};

ast.AssignmentStatement.prototype.compile = function( output ) {
	if( this.lvalue instanceof ast.VariableLvalue ) {
		output.code += encodeVariable( this.lvalue.token.value ) + '=';
		this.rvalue.compile( output );
		output.code += ';';
	} else if( this.lvalue instanceof ast.PropertyLvalue ) {
		output.code += '_.set(_fiber,';
		this.lvalue.expression.compile( output );
		output.code += ',"' + this.lvalue.property.value + '",';
		this.rvalue.compile( output );
		output.code += ');';
	} else if( this.lvalue instanceof ast.IndexLvalue ) {
		output.code += '_.setIndex(_fiber,';
		this.lvalue.expression.compile( output );
		output.code += ',';
		this.lvalue.index.compile( output );
		output.code += ',';
		this.rvalue.compile( output );
		output.code += ');';
	} else {
		console.assert( false );
	}
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

ast.LteqExpression.prototype.compile = function( output ) {
	output.code += '_.lteq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.GteqExpression.prototype.compile = function( output ) {
	output.code += '_.gteq(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.UnionExpression.prototype.compile = function( output ) {
	output.code += '_.union(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.IntersectionExpression.prototype.compile = function( output ) {
	output.code += '_.intersection(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ')';
};

ast.AddExpression.prototype.compile = function( output ) {
	output.code += '_.add(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.SubExpression.prototype.compile = function( output ) {
	output.code += '_.sub(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.MulExpression.prototype.compile = function( output ) {
	output.code += '_.mul(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.DivExpression.prototype.compile = function( output ) {
	output.code += '_.div(_fiber,';
	this.left.compile( output );
	output.code += ',';
	this.right.compile( output );
	output.code += ',void _fiber.setLine(' + this.operator.line + '))';
};

ast.CallExpression.prototype.compile = function( output ) {
	output.code += '(';
	this.callee.compile( output );
	output.code += ').call(_fiber,[';
	this.arguments.forEachValue( function( a ) {
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
	output.code += '_.createFunction(function(_fiber,fn,args){args=args||[];';
	output.code += '_.validateFunctionCallArguments(_fiber,fn,args,[';
	this.parameters.forEachValue( function( parameter ) {
		output.code += '{';
		if( parameter.type ) {
			output.code += 'type:';
			parameter.type.compile( output );
			output.code += ',';
		}
		if( parameter.default ) {
			output.code += 'default:function(){return(';
			parameter.default.compile( output );
			output.code += ');},';
		}
		output.code += '},';
	} );
	output.code += ']);';
	output.code += 'let r=function(){';
	this.parameters.forEachValue( function( parameter, i ) {
		output.code += 'let ' + encodeVariable( parameter.variable.value ) + '=args[' + i + '];';
	} );
	this.block.statements.forEach( function( s ) {
		s.compile( output );
	} );
	output.code += '}();';
	if( this.returnType ) {
		output.code += '_.validateFunctionCallReturnType(_fiber,this,r,';
		this.returnType.compile( output );
		output.code += ');';
	}
	output.code += 'return r;},{';
	if( this.name ) {
		output.code += 'name:' + encodeString( this.name ) + ',';
	}
	output.code += 'safe:' + encodeBoolean( this.safe ) + ',';
	output.code += 'origin:_origin,';
	output.code += 'line:' + this.keyword.line + ',';
	output.code += '})';
};

ast.TupleLiteral.prototype.compile = function( output ) {
	output.code += '_.createTuple([';
	this.items.forEachValue( function( item, i ) {
		item.compile( output );
		output.code += ',';
	} );
	output.code += '])';
};

ast.ListLiteral.prototype.compile = function( output ) {
	output.code += '_.createList([';
	this.items.forEachValue( function( item, i ) {
		item.compile( output );
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
		output.code += '_.implicit(_fiber,"' + this.token.value + '",void _fiber.setLine(' + this.token.line + '))';
	}
};

ast.VariableExpression.prototype.compile = function( output ) {
	output.code += encodeVariable( this.token.value );
};

ast.StringLiteral.prototype.compile = function( output ) {
	output.code += '_.createString("';
	for( let i = 0 ; i < this.value.length ; i++ ) {
		let c = this.value.charCodeAt( i );
		output.code += "\\u" + ( "0000" + c.toString( 16 ) ).slice( -4 );
	}
	output.code += '")';
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
