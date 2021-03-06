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
	
	function readEndOfStatement() {
		if( peek().type === "eof" || peek().type === "}" ) {
			return undefined;
		} else {
			return read( "newline" );
		}
	}
	
	//
	// Expressions
	//
	
	function parseExpression() {
		return parseOrExpression();
	}
	
	function parseStringLiteral() {
		// do not read the token until we are done, that way any errors we throw will point at the right token
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
	
	function parseBytesLiteral() {
		// do not read the token until we are done, that way any errors we throw will point at the right token
		let token = peek();
		console.assert( token.type === "bytes_literal" );
		let source = token.value;
		let value = [];
		let i = 2;
		while( i < source.length - 1 ) {
			let c = source[i];
			if( c === "\\" ) {
				i++;
				c = source[i];
				if( c === "\\" ) {
					value.push( "\\".charCodeAt( 0 ) )
					i++;
				} else if( c === "n" ) {
					value.push( "\n".charCodeAt( 0 ) )
					i++;
				} else if( c === "t" ) {
					value.push( "\t".charCodeAt( 0 ) )
					i++;
				} else if( c === "x" ) {
					let hex = source.substr( i+1, 2 );
					if( ! hex.match( /^[0-9a-fA-F]{2}$/ ) ) {
						throwError( "Invalid unicode escape sequence." );
					}
					value.push( parseInt( hex, 16 ) );
					i += 3;
				} else {
					throwError( "Invalid escape sequence." );
				}
			} else {
				value.push( c.charCodeAt( 0 ) )
				i++;
			}
		}
		read();
		return new ast.BytesLiteral( {
			token: token,
			value: value,
		} );
	}
	
	function parseParenthesizedOrTupleExpression() {
		let lparen = read( "(" );
		if( peek().type === ")" ) {
			let rparen = read( ")" );
			return new ast.TupleLiteral( {
				lparen: lparen,
				items: new SeparatedList(),
				rparen: rparen,
			} );
		}
		let expression = parseExpression();
		if( peek().type === "," ) {
			let items = new SeparatedList();
			items.pushValue( expression );
			items.pushSeparator( read( "," ) );
			while( peek().type !== ")" ) {
				items.pushValue( parseExpression() );
				if( peek().type === "," ) {
					items.pushSeparator( read() );
				} else {
					break;
				}
			}
			let rparen = read( ")" );
			return new ast.TupleLiteral( {
				lparen: lparen,
				items: items,
				rparen: rparen,
			} );
		} else {
			let rparen = read( ")" );
			return new ast.ParenthesizedExpression( {
				lparen: lparen,
				expression: expression,
				rparen: rparen,
			} );
		}
	}
	
	function parseListLiteral() {
		let lbracket = read( "[" );
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
		let rbracket = read( "]" );
		return new ast.ListLiteral( {
			lbracket: lbracket,
			items: items,
			rbracket: rbracket,
		} );
	}
	
	function parseFunction() {
		let keyword = read( "function" );
		let r = parseCallableSignature( ast.FunctionParameter );
		let lparen = r[0];
		let parameters = r[1];
		let rparen = r[2];
		let arrow = r[3];
		let returnType = r[4];
		let block = parseBlock( false );
		return new ast.FunctionExpression( {
			keyword: keyword,
			lparen: lparen,
			parameters: parameters,
			rparen: rparen,
			arrow: arrow,
			returnType: returnType,
			block: block,
		} );
	}
	
	function parseClass() {
		let keyword = read( "class" );
		let lbrace = read( "{" );
		let items = [];
		while( peek().type !== "}" ) {
			if( peek().type === "property" ) {
				items.push( parseClassProperty() );
			} else if( peek().type === "method" ) {
				items.push( parseClassMethod() );
			} else {
				throwError( "..." ); // TODO
			}
		}
		let rbrace = read( "}" );
		return new ast.ClassExpression( {
			keyword: keyword,
			lbrace: lbrace,
			items: items,
			rbrace: rbrace,
		} );
		
		function parseClassProperty() {
			let keyword = read( "property" );
			let type;
			if( peek().type !== "identifier" || ( peek(1).type !== "newline" && peek(1).type !== "}" ) ) {
				type = parseExpression();
			}
			let name = read( "identifier" );
			let newline = readEndOfStatement();
			return new ast.ClassProperty( {
				keyword: keyword,
				type: type,
				name: name,
				newline: newline,
			} );
		}
		
		function parseClassMethod() {
			let keyword = read( "method" );
			let name = read( "identifier" );
			let r = parseCallableSignature( ast.ClassMethodParameter );
			let lparen = r[0];
			let parameters = r[1];
			let rparen = r[2];
			let arrow = r[3];
			let returnType = r[4];
			let block = parseBlock( false );
			let newline = readEndOfStatement();
			return new ast.ClassMethod( {
				keyword: keyword,
				name: name,
				lparen: lparen,
				parameters: parameters,
				rparen: rparen,
				arrow: arrow,
				returnType: returnType,
				block: block,
				newline: newline,
			} );
		}
	}
	
	function parseCallableSignature( ParameterClass ) {
		let lparen = read( "(" );
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
				parameters.pushValue( new ParameterClass( {
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
		let rparen = read( ")" );
		let arrow;
		let returnType;
		if( peek().type === "->" ) {
			arrow = read();
			returnType = parseExpression();
		}
		return [ lparen, parameters, rparen, arrow, returnType ];
	}
	
	function parseNew() {
		let keyword = read( "new" );
		let instantiatable = parseAtomExpression();
		// TODO arguments
		return new ast.NewExpression( {
			keyword: keyword,
			instantiatable: instantiatable,
		} );
	}
	
	function parseAtomExpression() {
		if( peek().type === "function" ) {
			return parseFunction();
		} else if( peek().type === "class" ) {
			return parseClass();
		} else if( peek().type === "new" ) {
			return parseNew();
		} else if( peek().type === "this" ) {
			return new ast.ThisExpression( { token: read() } );
		} else if( peek().type === "[" ) {
			return parseListLiteral();
		} else if( peek().type === "(" ) {
			return parseParenthesizedOrTupleExpression();
		} else if( peek().type === "identifier" ) {
			return new ast.IdentifierExpression( { token: read() } );
		} else if( peek().type === "variable" ) {
			return new ast.VariableExpression( { token: read() } );
		} else if( peek().type === "string_literal" ) {
			return parseStringLiteral();
		} else if( peek().type === "bytes_literal" ) {
			return parseBytesLiteral();
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
	
	function parseAccessExpression() {
		let expression = parseAtomExpression();
		while( true ) {
			if( peek().type === "(" ) {
				let lparen = read();
				let args = new SeparatedList();
				let namedArgs = new SeparatedList();
				if( peek().type !== ")" ) {
					while( true ) {
						if( peek().type === "variable" && peek(1).type === "=" ) {
							break;
						}
						args.pushValue( parseExpression() );
						if( peek().type === "," ) {
							args.pushSeparator( read() );
						} else {
							break;
						}
					}
					if( peek().type !== ")" ) {
						while( true ) {
							let variable = read( "variable" );
							let equalitySign = read( "=" );
							let expression = parseExpression();
							namedArgs.pushValue( {
								variable: variable,
								equalitySign: equalitySign,
								expression: expression,
							} );
							if( peek().type === "," ) {
								namedArgs.pushSeparator( read() );
							} else {
								break;
							}
						}
					}
				}
				let rparen = read( ")" );
				expression = new ast.CallExpression( {
					callee: expression,
					lparen: lparen,
					arguments: args,
					namedArguments: namedArgs,
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
	
	function parseIntersectionExpression() {
		let left = parseAccessExpression();
		while( peek().type === "&" ) {
			let operator = read();
			let right = parseAccessExpression();
			left = new ast.IntersectionExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		}
		return left;
	}
	
	function parseUnionExpression() {
		let left = parseIntersectionExpression();
		while( peek().type === "|" ) {
			let operator = read();
			let right = parseIntersectionExpression();
			left = new ast.UnionExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		}
		return left;
	}
	
	function parseMultiplicativeExpression() {
		let left = parseUnionExpression();
		while( true ) {
			if( peek().type === "*" ) {
				let operator = read();
				let right = parseUnionExpression();
				left = new ast.MulExpression( {
					left: left,
					operator: operator,
					right: right,
				} );
			} else if( peek().type === "/" ) {
				let operator = read();
				let right = parseUnionExpression();
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
	
	function parseComparisonExpression() {
		let left = parseAdditiveExpression();
		if( peek().type === "is" ) {
			let operator = read();
			if( peek().type === "not" ) {
				let not = read();
				let type = parseAdditiveExpression();
				return new ast.IsNotExpression( {
					expression: left,
					operator1: operator,
					operator2: not,
					type: type,
				} );
			} else {
				let type = parseAdditiveExpression();
				return new ast.IsExpression( {
					expression: left,
					operator: operator,
					type: type,
				} );
			}
		} else if( peek().type === "==" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.EqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "!=" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.NeqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "<" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.LtExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === ">" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.GtExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === "<=" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.LteqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else if( peek().type === ">=" ) {
			let operator = read();
			let right = parseAdditiveExpression();
			return new ast.GteqExpression( {
				left: left,
				operator: operator,
				right: right,
			} );
		} else {
			return left;
		}
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
	
	//
	// Lvalues
	//
	
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
	
	//
	// Statements
	//
	
	function parseStatement() {
		if( peek().type === "break" ) {
			return parseBreakStatement();
		} else if( peek().type === "continue" ) {
			return parseContinueStatement();
		} else if( peek().type === "for" || ( peek().type === "label" && peek(2).type === "for" ) ) {
			return parseForInStatement();
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
		} else if( peek().type === "while" || ( peek().type === "label" && peek(2).type === "while" ) ) {
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
	
	function parseBreakStatement() {
		let keyword = read( "break" );
		let label;
		if( peek().type === "label" ) {
			label = read();
		}
		let newline = readEndOfStatement();
		return new ast.BreakStatement( {
			keyword: keyword,
			label: label,
			newline: newline,
		} );
	}
	
	function parseContinueStatement() {
		let keyword = read( "continue" );
		let label;
		if( peek().type === "label" ) {
			label = read();
		}
		let newline = readEndOfStatement();
		return new ast.ContinueStatement( {
			keyword: keyword,
			label: label,
			newline: newline,
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
	
	function parseForInStatement() {
		let label;
		let labelNewline;
		if( peek().type === "label" ) {
			label = read();
			labelNewline = read( "newline" );
		}
		let keyword1 = read( "for" );
		let variable = read( "variable" );
		let keyword2 = read( "in" );
		let iterator = parseExpression();
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
		return new ast.ForInStatement( {
			label: label,
			labelNewline: labelNewline,
			keyword1: keyword1,
			variable: variable,
			keyword2: keyword2,
			iterator: iterator,
			block: block,
			elseClause: elseClause,
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
		let label;
		let labelNewline;
		if( peek().type === "label" ) {
			label = read();
			labelNewline = read( "newline" );
		}
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
			label: label,
			labelNewline: labelNewline,
			keyword: keyword,
			test: test,
			block: block,
			elseClause: elseClause,
		} );
	}
	
	//
	// Root node
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
};
