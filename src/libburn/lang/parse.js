"use strict";
let Error = require( "./Error" );
let ast = require( "./ast" );

module.exports = function( tokens ) {
	
	let offset = 0;
	let suppressedNewlinePolicies = [];
	let ignoreNewlines;
	return parseRoot();
	
	//
	// helpers
	//
	
	function throwError( message ) {
		let token = tokens[ offset ] || tokens[ tokens.length - 1 ];
		throw new Error( message, token );
	}
	
	function startIgnoringNewlines() {
		suppressedNewlinePolicies.push( ignoreNewlines );
		ignoreNewlines = true;
	}
	function stopIgnoringNewlines() {
		console.assert( ignoreNewlines === true );
		ignoreNewlines = suppressedNewlinePolicies.pop();
	}
	function startHeedingNewlines() {
		suppressedNewlinePolicies.push( ignoreNewlines );
		ignoreNewlines = false;
	}
	function stopHeedingNewlines() {
		console.assert( ignoreNewlines === false );
		ignoreNewlines = suppressedNewlinePolicies.pop();
	}
	
	function peek( peekOffset ) {
		peekOffset = peekOffset || 0;
		if( ignoreNewlines ) {
			let i = offset;
			let peeked = 0;
			while( tokens[i] ) {
				if( tokens[i].type === "newline" ) {
					i++;
				} else if( peeked === peekOffset ) {
					return tokens[i];
				} else {
					i++;
					peeked++;
				}
			}
			return { type: "eof" };
		} else {
			return tokens[ offset + peekOffset ] || { type: "eof" };
		}
	}
	
	function read( type ) {
		if( ignoreNewlines ) {
			skipNewlines();
		}
		if( ! tokens[ offset ] ) {
			if( type ) {
				throwError( "Expected " + humanizedType() + "." );
			} else {
				throwError( "unexpected eof" );
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
	
	function skipNewlines() {
		while( tokens[offset] && tokens[offset].type === "newline" ) {
			offset++;
		}
	}
	
	//
	// parsing logic
	//
	
	function parseRoot() {
		let statements = [];
		skipNewlines();
		while( peek().type !== "eof" ) {
			statements.push( parseStatement() );
			if( peek().type !== "newline" ) {
				throwError( "Expected newline." );
			}
			skipNewlines();
		}
		return new ast.Root( {
			statements: statements,
		} );
	}
	
	function parseBlock() {
		let statements = [];
		read( "{" );
		skipNewlines();
		startHeedingNewlines();
		while( peek().type !== "}" ) {
			statements.push( parseStatement() );
			if( peek().type === "newline" ) {
				skipNewlines();
			} else {
				break;
			}
		}
		stopHeedingNewlines();
		read( "}" );
		return statements;
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
				read();
				let rvalue = parseExpression();
				return new ast.AssignmentStatement( { lvalue: lvalue, rvalue: rvalue } );
			} else {
				return new ast.ExpressionStatement( { expression: expression } );
			}
		}
	}
	
	function parseBreakStatement() {
		read( "break" );
		return new ast.BreakStatement();
	}
	
	function parseContinueStatement() {
		read( "continue" );
		return new ast.ContinueStatement();
	}
	
	function parseIfStatement() {
		read( "if" );
		startIgnoringNewlines();
		let test = parseExpression();
		let block = parseBlock();
		let elseIfClauses = [];
		let elseClause;
		while( peek().type === "else" ) {
			read();
			if( peek().type === "if" ) {
				read();
				let elseIfTest = parseExpression();
				let elseIfBlock = parseBlock();
				elseIfClauses.push( new ast.ElseIfClause( {
					test: elseIfTest,
					block: elseIfBlock,
				} ) );
			} else {
				elseClause = new ast.ElseClause( { block: parseBlock() } );
				break;
			}
		}
		stopIgnoringNewlines();
		return new ast.IfStatement( {
			test: test,
			block: block,
			elseIfClauses: elseIfClauses,
			elseClause: elseClause,
		} );
	}
	
	function parseImportStatement() {
		let keyword = read( "import" );
		let fqn = parsePath();
		let alias = fqn[ fqn.length - 1 ];
		return new ast.ImportStatement( {
			keyword: keyword,
			fqn: fqn,
			alias: alias,
		} );
	}
	
	function parseIncludeStatement() {
		let keyword = read( "include" );
		let expression = parseExpression();
		return new ast.IncludeStatement( {
			keyword: keyword,
			expression: expression,
		} );
	}
	
	function parsePath() {
		let path = [];
		while( true ) {
			path.push( read( "identifier" ) );
			if( peek().type === "." ) {
				read();
			} else {
				break;
			}
		}
		return path;
	}
	
	function parseLetStatement() {
		read( "let" );
		let variable = read( "variable" );
		let initialValue;
		if( peek().type !== "newline" && peek().type !== "}" ) {
			read( "=" );
			initialValue = parseExpression();
		}
		return new ast.LetStatement( {
			variable: variable,
			initialValue: initialValue,
		} );
	}
	
	function parsePrintStatement() {
		let keyword = read( "print" );
		return new ast.PrintStatement( {
			keyword: keyword,
			expression: parseExpression(),
		} );
	}
	
	function parseReturnStatement() {
		read( "return" );
		if( peek().type === "newline" || peek().type === "}" ) {
			return new ast.ReturnStatement();
		} else {
			return new ast.ReturnStatement( { expression: parseExpression() } );
		}
	}
	
	function parseThrowStatement() {
		read( "throw" );
		return new ast.ThrowStatement( { expression: parseExpression() } );
	}
	
	function parseTryStatement() {
		read( "try" );
		startIgnoringNewlines();
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
			read();
			let block = parseBlock();
			elseClause = new ast.ElseClause( { block: block } );
		}
		let finallyClause;
		if( peek().type === "finally" ) {
			read();
			let block = parseBlock();
			finallyClause = new ast.FinallyClause( { block: block } );
		}
		stopIgnoringNewlines();
		return new ast.TryStatement( {
			block: block,
			catchClauses: catchClauses,
			elseClause: elseClause,
			finallyClause: finallyClause,
		} );
	}
	
	function parseWhileStatement() {
		read( "while" );
		startIgnoringNewlines();
		let test = parseExpression();
		let block = parseBlock();
		let elseClause;
		if( peek().type === "else" ) {
			read();
			elseClause = new ast.ElseClause( { block: parseBlock() } );
		}
		stopIgnoringNewlines();
		return new ast.WhileStatement( {
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
			read();
			let not = false;
			if( peek().type === "not" ) {
				read();
				not = true;
			}
			let type = parseUnionExpression();
			return new ast.IsExpression( {
				not: not,
				expression: left,
				type: type,
			} );
		} else if( peek().type === "==" ) {
			read();
			let right = parseUnionExpression();
			return new ast.EqExpression( {
				left: left,
				right: right,
			} );
		} else if( peek().type === "!=" ) {
			read();
			let right = parseUnionExpression();
			return new ast.NeqExpression( {
				left: left,
				right: right,
			} );
		} else if( peek().type === "<" ) {
			read();
			let right = parseUnionExpression();
			return new ast.LtExpression( {
				left: left,
				right: right,
			} );
		} else if( peek().type === ">" ) {
			read();
			let right = parseUnionExpression();
			return new ast.GtExpression( {
				left: left,
				right: right,
			} );
		} else if( peek().type === "<=" ) {
			read();
			let right = parseUnionExpression();
			return new ast.LtEqExpression( {
				left: left,
				right: right,
			} );
		} else if( peek().type === ">=" ) {
			read();
			let right = parseUnionExpression();
			return new ast.GtEqExpression( {
				left: left,
				right: right,
			} );
		} else {
			return left;
		}
	}
	
	function parseUnionExpression() {
		let left = parseAdditiveExpression();
		while( peek().type === "|" ) {
			read();
			let right = parseAdditiveExpression();
			left = new ast.UnionExpression( {
				left: left,
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
				left = new ast.AdditionExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else if( peek().type === "-" ) {
				let operator = read();
				let right = parseMultiplicativeExpression();
				left = new ast.SubtractionExpression( {
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
				left = new ast.MultiplicationExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else if( peek().type === "/" ) {
				let operator = read();
				let right = parseAccessExpression();
				left = new ast.DivisionExpression( {
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
				startIgnoringNewlines();
				let args = [];
				if( peek().type !== ")" ) {
					while( true ) {
						args.push( parseExpression() );
						if( peek().type === "," ) {
							read();
						} else {
							break;
						}
					}
				}
				read( ")" );
				stopIgnoringNewlines();
				expression = new ast.CallExpression( {
					callee: expression,
					lparen: lparen,
					arguments: args,
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
				startIgnoringNewlines();
				let index = parseExpression();
				read( "]" );
				stopIgnoringNewlines();
				expression = new ast.IndexExpression( {
					expression: expression,
					lbracket: lbracket,
					index: index,
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
			return new ast.IntegerLiteral( { token: read() } );
		} else if( peek().type === "float_literal" ) {
			return new ast.FloatLiteral( { token: read() } );
		} else if( peek().type === "true" || peek().type === "false" ) {
			return new ast.BooleanLiteral( { token: read() } );
		} else if( peek().type === "nothing" ) {
			read();
			return new ast.NothingLiteral();
		} else {
			throwError( "Expected expression." );
		}
	}
	
	function parseFunction() {
		let keyword = read( "function" );
		startIgnoringNewlines();
		read( "(" );
		let parameters = [];
		if( peek().type !== ")" ) {
			while( true ) {
				let type;
				if( peek().type !== "variable" || ( peek(1).type !== "=" && peek(1).type !== "," && peek(1).type !== ")" ) ) {
					type = parseExpression();
				}
				let variable = read( "variable" );
				let defaultValue;
				if( peek().type === "=" ) {
					read();
					defaultValue = parseExpression();
				}
				parameters.push( new ast.FunctionParameter( {
					type: type,
					variable: variable,
					defaultValue: defaultValue,
				} ) );
				if( peek().type === "," ) {
					read();
				} else {
					break;
				}
			}
		}
		read( ")" );
		let returnType;
		if( peek().type === "->" ) {
			read();
			returnType = parseExpression();
		}
		let block = parseBlock();
		stopIgnoringNewlines();
		return new ast.FunctionExpression( {
			keyword: keyword,
			parameters: parameters,
			returnType: returnType,
			block: block,
		} );
	}
	
	function parseListLiteral() {
		read( "[" );
		startIgnoringNewlines();
		let items = [];
		while( peek().type !== "]" ) {
			items.push( parseExpression() );
			if( peek().type === "," ) {
				read();
				continue;
			} else {
				break;
			}
		}
		read( "]" );
		stopIgnoringNewlines();
		return new ast.ListLiteral( {
			items: items,
		} );
	}
	
	function parseParenthesizedExpression() {
		read( "(" );
		startIgnoringNewlines();
		let expression = parseExpression();
		read( ")" );
		stopIgnoringNewlines();
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
			} );
		} else {
			console.assert( false );
		}
	}
};
