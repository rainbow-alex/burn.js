"use strict";
let Error = require( "./Error" );
let ast = require( "./ast" );
let SeparatedList = require( "./SeparatedList" );

module.exports = function( tokens ) {
	
	let offset = 0;
	let suppressedNewlinePolicies = [];
	return parseRoot();
	
	//
	// helpers
	//
	
	function throwError( message ) {
		let token = tokens[ offset ] || tokens[ tokens.length - 1 ];
		throw new Error( message, token );
	}
	
	function peek( peekOffset ) {
		peekOffset = peekOffset || 0;
		return tokens[ offset + peekOffset ] || { type: "eof" };
	}
	
	function read( type ) {
		if( ! tokens[ offset ] ) {
			if( type ) {
				throwError( "Expected " + humanizedType() + "." );
			} else {
				throwError( "Unexpected eof." );
			}
		}
		if( type && tokens[ offset ].type !== type ) {
			throwError( "Expected " + humanizedType() + "." );
		}
		return tokens[ offset++ ];
		function humanizedType() {
			if( type === "newline" ) {
				return type;
			} else if( type === "variable" || type === "identifier" ) {
				return "<" + type + ">";
			} else {
				return "`" + type + "`";
			}
		}
	}
	
	//
	// parsing logic
	//
	
	function parseRoot() {
		let annotations = [];
		let statements = [];
		while( peek().type !== "eof" ) {
			if( peek().type === "annotation_key" ) {
				annotations.push( parseAnnotation() );
			} else {
				let statement = parseStatement();
				statement.annotations = annotations;
				annotations = [];
				statements.push( statement );
			}
		}
		if( annotations.length ) {
			throwError( "Expected statement." );
		}
		return new ast.Root( {
			statements: statements,
		} );
	}
	
	function parseBlock( readTrailingNewline ) {
		readTrailingNewline = readTrailingNewline === undefined ? true : readTrailingNewline;
		let annotations = [];
		let statements = [];
		let lbrace = read( "{" );
		while( peek().type !== "}" ) {
			if( peek().type === "annotation_key" ) {
				annotations.push( parseAnnotation() );
			} else {
				let statement = parseStatement();
				statement.annotations = annotations;
				annotations = [];
				statements.push( statement );
			}
		}
		if( annotations.length ) {
			throwError( "Expected statement." );
		}
		let rbrace = read( "}" );
		let newline;
		if( readTrailingNewline && peek().type === "newline" ) {
			newline = read();
		}
		return new ast.Block( {
			lbrace: lbrace,
			statements: statements,
			rbrace: rbrace,
			newline: newline,
		} );
	}
	
	function parseAnnotation() {
		let key = read( "annotation_key" );
		let tokens = [];
		while( peek().type !== "newline" && peek().type !== "eof" ) {
			tokens.push( read() );
		}
		let newline = readEndOfStatement();
		return new ast.Annotation( {
			key: key,
			tokens: tokens,
			newline: newline,
		} );
	}
	
	function parseStatement() {
		if( peek().type === "break" ) {
			return parseBreakStatement();
		} else if( peek().type === "continue" ) {
			return parseContinueStatement();
		} else if( peek().type === "if" ) {
			return parseIfStatement();
		} else if( peek().type === "import" ) {
			return parseImportStatement();
		} else if( peek().type === "include" ) {
			return parseIncludeStatement();
		} else if( peek().type === "let" ) {
			return parseLetStatement();
		} else if( peek().type === "print" ) {
			return parsePrintStatement();
		} else if( peek().type === "return" ) {
			return parseReturnStatement();
		} else if( peek().type === "throw" ) {
			return parseThrowStatement();
		} else if( peek().type === "try" ) {
			return parseTryStatement();
		} else if( peek().type === "while" ) {
			return parseWhileStatement();
		} else {
			let expression = parseExpression();
			if( peek().type === "=" ) {
				let lvalue = toLvalue( expression );
				let operator = read();
				let rvalue = parseExpression();
				let newline = readEndOfStatement();
				return new ast.AssignmentStatement( {
					lvalue: lvalue,
					operator: operator,
					rvalue: rvalue,
					newline: newline,
				} );
			} else {
				let newline = readEndOfStatement();
				return new ast.ExpressionStatement( {
					expression: expression,
					newline: newline,
				} );
			}
		}
	}
	
	function readEndOfStatement() {
		if( peek().type === "eof" || peek().type === "}" ) {
			return undefined;
		} else {
			return read( "newline" );
		}
	}
	
	function parseBreakStatement() {
		let keyword = read( "break" );
		let newline = readEndOfStatement();
		return new ast.BreakStatement( {
			keyword: keyword,
			newline: newline,
		} );
	}
	
	function parseContinueStatement() {
		let keyword = read( "continue" );
		let newline = readEndOfStatement();
		return new ast.ContinueStatement( {
			keyword: keyword,
			newline: newline,
		} );
	}
	
	function parseIfStatement() {
		let keyword = read( "if" );
		let test = parseExpression();
		let block = parseBlock();
		let elseIfClauses = [];
		let elseClause;
		while( peek().type === "else" ) {
			let keyword = read();
			if( peek().type === "if" ) {
				let keyword2 = read();
				let elseIfTest = parseExpression();
				let elseIfBlock = parseBlock();
				elseIfClauses.push( new ast.ElseIfClause( {
					keyword1: keyword,
					keyword2: keyword2,
					test: elseIfTest,
					block: elseIfBlock,
				} ) );
			} else {
				let elseBlock = parseBlock();
				elseClause = new ast.ElseClause( {
					keyword: keyword,
					block: elseBlock,
				} );
				break;
			}
		}
		return new ast.IfStatement( {
			keyword: keyword,
			test: test,
			block: block,
			elseIfClauses: elseIfClauses,
			elseClause: elseClause,
		} );
	}
	
	function parseImportStatement() {
		let keyword = read( "import" );
		let fqn = parsePath();
		let newline = readEndOfStatement();
		return new ast.ImportStatement( {
			keyword: keyword,
			fqn: fqn,
			newline: newline,
		} );
	}
	
	function parsePath() {
		let path = new SeparatedList();
		while( true ) {
			path.pushValue( read( "identifier" ) );
			if( peek().type === "." ) {
				path.pushSeparator( read() );
			} else {
				break;
			}
		}
		return path;
	}
	
	function parseIncludeStatement() {
		let keyword = read( "include" );
		let expression = parseExpression();
		let newline = readEndOfStatement();
		return new ast.IncludeStatement( {
			keyword: keyword,
			expression: expression,
			newline: newline,
		} );
	}
	
	function parseLetStatement() {
		let keyword = read( "let" );
		let variable = read( "variable" );
		let equalitySign;
		let initialValue;
		if( peek().type !== "newline" && peek().type !== "}" ) {
			equalitySign = read( "=" );
			initialValue = parseExpression();
		}
		let newline = readEndOfStatement();
		return new ast.LetStatement( {
			keyword: keyword,
			variable: variable,
			equalitySign: equalitySign,
			initialValue: initialValue,
			newline: newline,
		} );
	}
	
	function parsePrintStatement() {
		let keyword = read( "print" );
		let expression = parseExpression();
		let newline = readEndOfStatement();
		return new ast.PrintStatement( {
			keyword: keyword,
			expression: expression,
			newline: newline,
		} );
	}
	
	function parseReturnStatement() {
		let keyword = read( "return" );
		let expression;
		if( peek().type !== "newline" && peek().type !== "}" ) {
			expression = parseExpression();
		}
		let newline = readEndOfStatement();
		return new ast.ReturnStatement( {
			keyword: keyword,
			expression: expression,
			newline: newline,
		} );
	}
	
	function parseThrowStatement() {
		let keyword = read( "throw" );
		let expression = parseExpression();
		let newline = readEndOfStatement();
		return new ast.ThrowStatement( {
			keyword: keyword,
			expression: expression,
			newline: newline,
		} );
	}
	
	function parseTryStatement() {
		let keyword = read( "try" );
		let block = parseBlock();
		let catchClauses = [];
		while( peek().type === "catch" ) {
			let keyword = read();
			let type;
			if( peek().type !== "variable" && peek().type !== "{" ) {
				type = parseExpression();
			}
			let variable = read( "variable" );
			let block = parseBlock();
			catchClauses.push( new ast.CatchClause( {
				keyword: keyword,
				type: type,
				variable: variable,
				block: block,
			} ) );
		}
		let elseClause;
		if( peek().type === "else" ) {
			let keyword = read();
			let block = parseBlock();
			elseClause = new ast.ElseClause( {
				keyword: keyword,
				block: block,
			} );
		}
		let finallyClause;
		if( peek().type === "finally" ) {
			let keyword = read();
			let block = parseBlock();
			finallyClause = new ast.FinallyClause( {
				keyword: keyword,
				block: block,
			} );
		}
		return new ast.TryStatement( {
			keyword: keyword,
			block: block,
			catchClauses: catchClauses,
			elseClause: elseClause,
			finallyClause: finallyClause,
		} );
	}
	
	function parseWhileStatement() {
		let keyword = read( "while" );
		let test = parseExpression();
		let block = parseBlock();
		let elseClause;
		if( peek().type === "else" ) {
			let keyword = read();
			let block = parseBlock();
			elseClause = new ast.ElseClause( {
				keyword: keyword,
				block: block,
			} );
		}
		return new ast.WhileStatement( {
			keyword: keyword,
			test: test,
			block: block,
			elseClause: elseClause,
		} );
	}
	
	function parseExpression() {
		return parseOrExpression();
	}
	
	function parseOrExpression() {
		let left = parseAndExpression();
		while( peek().type === "or" ) {
			let operator = read();
			let right = parseAndExpression();
			left = new ast.OrExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		}
		return left;
	}
	
	function parseAndExpression() {
		let left = parseNotExpression();
		while( peek().type === "and" ) {
			let operator = read();
			let right = parseNotExpression();
			left = new ast.AndExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		}
		return left;
	}
	
	function parseNotExpression() {
		if( peek().type === "not" ) {
			let operator = read();
			let expression = parseComparisonExpression();
			return new ast.NotExpression( {
				operator: operator,
				expression: expression,
			} );
		} else {
			return parseComparisonExpression();
		}
	}
	
	function parseComparisonExpression() {
		let left = parseUnionExpression();
		if( peek().type === "is" ) {
			let operator = read();
			let not;
			if( peek().type === "not" ) {
				not = read();
			}
			let type = parseUnionExpression();
			return new ast.IsExpression( {
				expression: left,
				operator: operator,
				not: not,
				type: type,
			} );
		} else if( peek().type === "==" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.EqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "!=" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.NeqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "<" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.LtExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === ">" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.GtExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "<=" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.LteqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === ">=" ) {
			let operator = read();
			let right = parseUnionExpression();
			return new ast.GteqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else {
			return left;
		}
	}
	
	function parseUnionExpression() {
		let left = parseAdditiveExpression();
		while( peek().type === "|" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			left = new ast.UnionExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		}
		return left;
	}
	
	function parseAdditiveExpression() {
		let left = parseMultiplicativeExpression();
		while( true ) {
			if( peek().type === "+" ) {
				let operator = read();
				let right = parseMultiplicativeExpression();
				left = new ast.AddExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else if( peek().type === "-" ) {
				let operator = read();
				let right = parseMultiplicativeExpression();
				left = new ast.SubExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else {
				break;
			}
		}
		return left;
	}
	
	function parseMultiplicativeExpression() {
		let left = parseAccessExpression();
		while( true ) {
			if( peek().type === "*" ) {
				let operator = read();
				let right = parseAccessExpression();
				left = new ast.MulExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else if( peek().type === "/" ) {
				let operator = read();
				let right = parseAccessExpression();
				left = new ast.DivExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else {
				break;
			}
		}
		return left;
	}
	
	function parseAccessExpression() {
		let expression = parseAtomExpression();
		while( true ) {
			if( peek().type === "(" ) {
				let lparen = read();
				let args = new SeparatedList();
				if( peek().type !== ")" ) {
					while( true ) {
						args.pushValue( parseExpression() );
						if( peek().type === "," ) {
							args.pushSeparator( read() );
						} else {
							break;
						}
					}
				}
				let rparen = read( ")" );
				expression = new ast.CallExpression( {
					callee: expression,
					lparen: lparen,
					arguments: args,
					rparen: rparen,
				} );
			} else if( peek().type === "." ) {
				let dot = read();
				let property = read( "identifier" );
				expression = new ast.PropertyExpression( {
					expression: expression,
					dot: dot,
					property: property,
				} );
			} else if( peek().type === "[" ) {
				let lbracket = read();
				let index = parseExpression();
				let rbracket = read( "]" );
				expression = new ast.IndexExpression( {
					expression: expression,
					lbracket: lbracket,
					index: index,
					rbracket: rbracket,
				} );
			} else {
				break;
			}
		}
		return expression;
	}
	
	function parseAtomExpression() {
		if( peek().type === "function" ) {
			return parseFunction();
		} else if( peek().type === "[" ) {
			return parseListLiteral();
		} else if( peek().type === "(" ) {
			return parseParenthesizedExpression();
		} else if( peek().type === "identifier" ) {
			return new ast.IdentifierExpression( { token: read() } );
		} else if( peek().type === "variable" ) {
			return new ast.VariableExpression( { token: read() } );
		} else if( peek().type === "string_literal" ) {
			return parseStringLiteral();
		} else if( peek().type === "integer_literal" ) {
			let token = read();
			return new ast.IntegerLiteral( {
				token: token,
				value: parseInt( token.value, 10 ),
			} );
		} else if( peek().type === "float_literal" ) {
			let token = read();
			return new ast.FloatLiteral( {
				token: token,
				value: parseFloat( token.value ),
			} );
		} else if( peek().type === "true" || peek().type === "false" ) {
			return new ast.BooleanLiteral( { token: read() } );
		} else if( peek().type === "nothing" ) {
			return new ast.NothingLiteral( { token: read() } );
		} else {
			throwError( "Expected expression." );
		}
	}
	
	function parseFunction() {
		let keyword = read( "function" );
		let left_parenthesis = read( "(" );
		let parameters = new SeparatedList();
		if( peek().type !== ")" ) {
			while( true ) {
				let type;
				if( peek().type !== "variable" || ( peek(1).type !== "=" && peek(1).type !== "," && peek(1).type !== ")" ) ) {
					type = parseExpression();
				}
				let variable = read( "variable" );
				let equalitySign;
				let defaultValue;
				if( peek().type === "=" ) {
					equalitySign = read();
					defaultValue = parseExpression();
				}
				parameters.pushValue( new ast.FunctionParameter( {
					type: type,
					variable: variable,
					equalitySign: equalitySign,
					defaultValue: defaultValue,
				} ) );
				if( peek().type === "," ) {
					parameters.pushSeparator( read() );
				} else {
					break;
				}
			}
		}
		let right_parenthesis = read( ")" );
		let arrow;
		let returnType;
		if( peek().type === "->" ) {
			arrow = read();
			returnType = parseExpression();
		}
		let block = parseBlock( false );
		return new ast.FunctionExpression( {
			keyword: keyword,
			lparen: left_parenthesis,
			parameters: parameters,
			rparen: right_parenthesis,
			arrow: arrow,
			returnType: returnType,
			block: block,
		} );
	}
	
	function parseListLiteral() {
		read( "[" );
		let items = new SeparatedList();
		while( peek().type !== "]" ) {
			items.pushValue( parseExpression() );
			if( peek().type === "," ) {
				items.pushSeparator( read() );
				continue;
			} else {
				break;
			}
		}
		read( "]" );
		return new ast.ListLiteral( {
			items: items,
		} );
	}
	
	function parseParenthesizedExpression() {
		read( "(" );
		let expression = parseExpression();
		read( ")" );
		return new ast.ParenthesizedExpression( {
			expression: expression,
		} );
	}
	
	function parseStringLiteral() {
		let token = peek();
		console.assert( token.type === "string_literal" );
		let source = token.value;
		let value = "";
		let i = 1;
		while( i < source.length - 1 ) {
			let c = source[i];
			if( c === "\\" ) {
				i++;
				c = source[i];
				if( c === "\\" ) {
					value += "\\";
					i++;
				} else if( c === "n" ) {
					value += "\n";
					i++;
				} else if( c === "t" ) {
					value += "\t";
					i++;
				} else if( c === "x" ) {
					let hex = source.substr( i+1, 2 );
					if( ! hex.match( /^[0-9a-fA-F]{2}$/ ) ) {
						throwError( "Invalid unicode escape sequence." );
					}
					let codepoint = parseInt( hex, 16 );
					value += String.fromCodePoint( codepoint );
					i += 3;
				} else if( c === "u" ) {
					let hex = source.substr( i+1, 4 );
					if( ! hex.match( /^[0-9a-fA-F]{4}$/ ) ) {
						throwError( "Invalid unicode escape sequence." );
					}
					let codepoint = parseInt( hex, 16 );
					if( 0xD800 <= codepoint && codepoint <= 0xDFFF ) {
						throwError( "Invalid unicode codepoint. U+" + hex + " is a surrogate." );
					}
					value += String.fromCodePoint( codepoint );
					i += 5;
				} else if( c === "U" ) {
					let hex = source.substr( i+1, 8 );
					if( ! hex.match( /^[0-9a-fA-F]{8}$/ ) ) {
						throwError( "Invalid unicode escape sequence." );
					}
					let codepoint = parseInt( hex, 16 );
					if( codepoint > 0x10FFFF ) {
						throwError( "Invalid unicode codepoint. U+" + hex + " is out of the unicode range." );
					} else if( 0xD800 <= codepoint && codepoint <= 0xDFFF ) {
						throwError( "Invalid unicode codepoint. U+" + hex + " is a surrogate." );
					}
					value += String.fromCodePoint( codepoint );
					i += 9;
				} else {
					throwError( "Invalid escape sequence." );
				}
			} else {
				value += c;
				i++;
			}
		}
		read();
		return new ast.StringLiteral( {
			token: token,
			value: value,
		} );
	}
	
	function toLvalue( node ) {
		if( node instanceof ast.VariableExpression ) {
			return new ast.VariableLvalue( {
				token: node.token,
			} );
		} else if( node instanceof ast.PropertyExpression ) {
			return new ast.PropertyLvalue( {
				expression: node.expression,
				dot: node.dot,
				property: node.property,
			} );
		} else if( node instanceof ast.IndexExpression ) {
			return new ast.IndexLvalue( {
				expression: node.expression,
				lbracket: node.lbracket,
				index: node.index,
				rbracket: node.rbracket,
			} );
		} else {
			console.assert( false );
		}
	}
};
