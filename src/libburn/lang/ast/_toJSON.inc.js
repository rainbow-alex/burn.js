"use strict";
let ast = require( "./" );

ast.Node.prototype.toJSON = function() {
	console.assert( false, "toJSON not implemented for " + this );
};

ast.Root.prototype.toJSON = function() {
	return {
		type: "node/root",
		children: [
			[ "statements", this.statements ],
		],
	};
};

ast.Block.prototype.toJSON = function() {
	return {
		type: "node/block",
		children: [
			[ "left_brace", this.lbrace ],
			[ "statements", this.statements ],
			[ "right_brace", this.rbrace ],
			[ "newline", this.newline ],
		],
	};
};

ast.Annotation.prototype.toJSON = function() {
	return {
		type: "node/annotation",
		children: [
			[ "key", this.key ],
			[ "tokens", this.tokens ],
			[ "newline", this.newline ],
		],
	};
};

ast.BreakStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/break",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "label", this.label ],
			[ "newline", this.newline ],
		],
	};
};

ast.ContinueStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/continue",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "label", this.label ],
			[ "newline", this.newline ],
		],
	};
};

ast.ForInStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/for_in",
		children: [
			[ "annotations", this.annotations ],
			[ "label", {
				type: "node/label",
				children: [
					[ "token", this.label ],
					[ "newline", this.labelNewline ],
				],
			} ],
			[ "keyword_for", this.keyword1 ],
			[ "variable", this.variable ],
			[ "keyword_in", this.keyword2 ],
			[ "block", this.block ],
			[ "newline", this.newline ],
			[ "else", this.elseClause ],
		],
	};
};

ast.IfStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/if",
		children: [
			[ "annotations", this.annotations ],
			[ "if", {
				type: "node/clause/if",
				children: [
					[ "keyword", this.keyword ],
					[ "test", this.test ],
					[ "block", this.block ],
					[ "newline", this.newline ],
				],
			} ],
			[ "else_if", this.elseIfClauses ],
			[ "else", this.elseClause ],
		],
	};
};

ast.ImportStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/import",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "fqn", this.fqn ],
			[ "newline", this.newline ],
		],
	};
};

ast.IncludeStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/include",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "expression", this.expression ],
			[ "newline", this.newline ],
		],
	};
};

ast.LetStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/let",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "variable", this.variable ],
			[ "initial_value", this.initialValue && {
				type: "node/initial_value",
				children: [
					[ "equality_sign", this.equalitySign ],
					[ "expression", this.initialValue ],
				],
			} ],
			[ "newline", this.newline ],
		],
	};
};

ast.PrintStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/print",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "expression", this.expression ],
			[ "newline", this.newline ],
		],
	};
};

ast.ReturnStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/return",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "expression", this.expression ],
			[ "newline", this.newline ],
		],
	};
};

ast.TryStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/try",
		children: [
			[ "annotations", this.annotations ],
			[ "try", {
				type: "node/clause/try",
				children: [
					[ "keyword", this.keyword ],
					[ "block", this.block ],
					[ "newline", this.newline ],
				],
			} ],
			[ "catch", this.catchClauses ],
			[ "else", this.elseClause ],
			[ "finally", this.finallyClause ],
		],
	};
};

ast.ThrowStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/throw",
		children: [
			[ "annotations", this.annotations ],
			[ "keyword", this.keyword ],
			[ "expression", this.expression ],
			[ "newline", this.newline ],
		],
	};
};

ast.WhileStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/while",
		children: [
			[ "annotations", this.annotations ],
			[ "label", {
				type: "node/label",
				children: [
					[ "token", this.label ],
					[ "newline", this.labelNewline ],
				],
			} ],
			[ "while", {
				type: "node/clause/while",
				children: [
					[ "keyword", this.keyword ],
					[ "test", this.test ],
					[ "block", this.block ],
					[ "newline", this.newline ],
				],
			} ],
			[ "else", this.elseClause ],
		],
	};
};

ast.ExpressionStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/expression",
		children: [
			[ "annotations", this.annotations ],
			[ "expression", this.expression ],
			[ "newline", this.newline ],
		],
	};
};

ast.AssignmentStatement.prototype.toJSON = function() {
	return {
		type: "node/statement/assignment",
		children: [
			[ "annotations", this.annotations ],
			[ "expression", this.expression ],
			[ "lvalue", this.lvalue ],
			[ "operator", this.operator ],
			[ "rvalue", this.rvalue ],
			[ "newline", this.newline ],
		],
	};
};

ast.ElseIfClause.prototype.toJSON = function() {
	return {
		type: "node/clause/else_if",
		children: [
			[ "keyword_else", this.keyword1 ],
			[ "keyword_if", this.keyword2 ],
			[ "test", this.test ],
			[ "block", this.block ],
			[ "newline", this.newline ],
		],
	};
};

ast.ElseClause.prototype.toJSON = function() {
	return {
		type: "node/clause/else",
		children: [
			[ "keyword", this.keyword ],
			[ "block", this.block ],
			[ "newline", this.newline ],
		],
	};
};

ast.CatchClause.prototype.toJSON = function() {
	return {
		type: "node/clause/catch",
		children: [
			[ "keyword", this.keyword ],
			[ "type", this.type ],
			[ "variable", this.variable ],
			[ "block", this.block ],
			[ "newline", this.newline ],
		],
	};
};

ast.FinallyClause.prototype.toJSON = function() {
	return {
		type: "node/clause/finally",
		children: [
			[ "keyword", this.keyword ],
			[ "block", this.block ],
			[ "newline", this.newline ],
		],
	};
};

ast.AndExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/and",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.OrExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/or",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.NotExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/not",
		children: [
			[ "operator", this.operator ],
			[ "expression", this.expression ],
		],
	};
};

ast.IsExpression.prototype.toJSON = function() {
	// TODO refactor into two separate node types
	if( this.not ) {
		return {
			type: "node/expression/is_not",
			children: [
				[ "expression", this.expression ],
				[ "operator_is", this.operator ],
				[ "operator_not", this.not ],
				[ "type", this.type ],
			],
		};
	} else {
		return {
			type: "node/expression/is",
			children: [
				[ "expression", this.expression ],
				[ "operator", this.operator ],
				[ "type", this.type ],
			],
		};
	}
};

ast.EqExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/eq",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.NeqExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/neq",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.LtExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/lt",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.GtExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/gt",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.LteqExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/lteq",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.GteqExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/gteq",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.UnionExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/union",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.AddExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/add",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.SubExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/sub",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.MulExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/mul",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.DivExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/div",
		children: [
			[ "left", this.left ],
			[ "operator", this.operator ],
			[ "right", this.right ],
		],
	};
};

ast.CallExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/call",
		children: [
			[ "callee", this.callee ],
			[ "left_parenthesis", this.lparen ],
			[ "arguments", this.arguments ],
			[ "right_parenthesis", this.rparen ],
		],
	};
};

ast.PropertyExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/property",
		children: [
			[ "accessee", this.expression ],
			[ "dot", this.dot ],
			[ "property", this.property ],
		],
	};
};

ast.IndexExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/index",
		children: [
			[ "accessee", this.expression ],
			[ "left_bracket", this.lbracket ],
			[ "index", this.index ],
			[ "right_bracket", this.rbracket ],
		],
	};
};

ast.FunctionExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/function",
		children: [
			[ "keyword", this.keyword ],
			[ "left_parenthesis", this.lparen ],
			[ "parameters", this.parameters ],
			[ "right_parenthesis", this.rparen ],
			[ "return_type", this.returnType && {
				type: "node/function_return_type",
				children: [
					[ "arrow", this.arrow ],
					[ "type", this.returnType ],
				],
			} ],
			[ "block", this.block ],
		],
	};
};

ast.FunctionParameter.prototype.toJSON = function() {
	return {
		type: "node/function_parameter",
		children: [
			[ "type", this.type ],
			[ "variable", this.variable ],
			[ "default", this.defaultValue && {
				type: "node/function_parameter_default",
				children: [
					[ "equality_sign", this.equalitySign ],
					[ "value", this.defaultValue ],
				],
			} ],
		],
	};
};

ast.ParenthesizedExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/parenthesized",
		children: [
			[ "left_parenthesis", this.lparen ],
			[ "expression", this.expression ],
			[ "right_parenthesis", this.rparen ],
		],
	};
};

ast.IdentifierExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/identifier",
		children: [
			[ "token", this.token ],
		],
	};
};

ast.VariableExpression.prototype.toJSON = function() {
	return {
		type: "node/expression/variable",
		children: [
			[ "token", this.token ],
		],
	};
};

ast.ListLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/list",
		children: [
			[ "items", this.items ],
		],
	};
};

ast.StringLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/string",
		children: [
			[ "token", this.token ],
		],
		value: this.value,
	};
};

ast.IntegerLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/integer",
		children: [
			[ "token", this.token ],
		],
		value: this.value,
	};
};

ast.FloatLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/float",
		children: [
			[ "token", this.token ],
		],
		value: this.value,
	};
};

ast.BooleanLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/boolean",
		children: [
			[ "token", this.token ],
		],
	};
};

ast.NothingLiteral.prototype.toJSON = function() {
	return {
		type: "node/expression/literal/nothing",
		children: [
			[ "token", this.token ],
		],
	};
};

ast.VariableLvalue.prototype.toJSON = function() {
	return {
		type: "node/lvalue/variable",
		children: [
			[ "token", this.token ],
		],
	};
};

ast.PropertyLvalue.prototype.toJSON = function() {
	return {
		type: "node/lvalue/property",
		children: [
			[ "accessee", this.expression ],
			[ "dot", this.dot ],
			[ "property", this.property ],
		],
	};
};

ast.IndexLvalue.prototype.toJSON = function() {
	return {
		type: "node/lvalue/index",
		children: [
			[ "accessee", this.expression ],
			[ "left_bracket", this.lbracket ],
			[ "index", this.index ],
			[ "right_bracket", this.rbracket ],
		],
	};
};
